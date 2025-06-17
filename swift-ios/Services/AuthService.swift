import Foundation
import Firebase
import FirebaseAuth
import FirebaseFirestore

// MARK: - AuthService
@MainActor
class AuthService: ObservableObject {
    
    // MARK: - Published Properties
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var needsOnboarding = false
    
    // MARK: - Private Properties
    private let auth = Auth.auth()
    private let firestore = Firestore.firestore()
    private var authStateListener: AuthStateDidChangeListenerHandle?
    
    // MARK: - Singleton
    static let shared = AuthService()
    
    private init() {
        setupAuthStateListener()
    }
    
    deinit {
        if let listener = authStateListener {
            auth.removeStateDidChangeListener(listener)
        }
    }
    
    // MARK: - Auth State Listener
    private func setupAuthStateListener() {
        authStateListener = auth.addStateDidChangeListener { [weak self] _, firebaseUser in
            Task { @MainActor in
                await self?.handleAuthStateChange(firebaseUser)
            }
        }
    }
    
    private func handleAuthStateChange(_ firebaseUser: Firebase.User?) async {
        isLoading = true
        
        if let firebaseUser = firebaseUser {
            print("🔄 Auth state changed: User signed in - \(firebaseUser.uid)")
            
            do {
                // Get user profile from Firestore
                let userProfile = try await getUserProfile(uid: firebaseUser.uid)
                
                if let profile = userProfile {
                    self.currentUser = profile
                    self.isAuthenticated = true
                    
                    // Check onboarding status
                    self.needsOnboarding = await checkOnboardingStatus(for: profile.id)
                    
                    print("✅ User profile loaded successfully")
                } else {
                    // Create minimal profile from Firebase Auth
                    let newUser = User(from: firebaseUser)
                    try await createUserProfile(user: newUser)
                    self.currentUser = newUser
                    self.isAuthenticated = true
                    self.needsOnboarding = true
                    
                    print("🆕 New user profile created")
                }
            } catch {
                print("❌ Error loading user profile: \(error)")
                // Create minimal profile even on error
                let minimalUser = User(from: firebaseUser)
                self.currentUser = minimalUser
                self.isAuthenticated = true
                self.needsOnboarding = true
            }
        } else {
            print("🚪 Auth state changed: User signed out")
            self.currentUser = nil
            self.isAuthenticated = false
            self.needsOnboarding = false
        }
        
        isLoading = false
    }
    
    // MARK: - Authentication Methods
    
    /// Register new user with email and password
    func register(data: RegisterData) async -> AuthResult {
        isLoading = true
        defer { isLoading = false }
        
        do {
            // Create Firebase Auth user
            let authResult = try await auth.createUser(withEmail: data.email, password: data.password)
            let firebaseUser = authResult.user
            
            // Update Firebase Auth profile
            let changeRequest = firebaseUser.createProfileChangeRequest()
            changeRequest.displayName = "\(data.name) \(data.surname ?? "")"
            try await changeRequest.commitChanges()
            
            // Create user profile for Firestore
            let newUser = User(
                id: firebaseUser.uid,
                email: data.email,
                name: data.name,
                surname: data.surname
            )
            
            // Save to Firestore
            try await createUserProfile(user: newUser)
            
            print("✅ Registration successful for: \(data.email)")
            return AuthResult.success(with: newUser, message: "Registration successful!")
            
        } catch {
            print("❌ Registration failed: \(error)")
            return AuthResult.failure(message: error.localizedDescription)
        }
    }
    
    /// Login with email and password
    func login(credentials: LoginCredentials) async -> AuthResult {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let authResult = try await auth.signIn(withEmail: credentials.email, password: credentials.password)
            let firebaseUser = authResult.user
            
            // Update last login in Firestore
            try await updateLastLogin(for: firebaseUser.uid)
            
            // Get user profile
            if let userProfile = try await getUserProfile(uid: firebaseUser.uid) {
                print("✅ Login successful for: \(credentials.email)")
                return AuthResult.success(with: userProfile, message: "Welcome back!")
            } else {
                // Create profile if doesn't exist
                let user = User(from: firebaseUser)
                try await createUserProfile(user: user)
                return AuthResult.success(with: user, message: "Welcome back!")
            }
            
        } catch {
            print("❌ Login failed: \(error)")
            return AuthResult.failure(message: "Invalid email or password")
        }
    }
    
    /// Logout current user
    func logout() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            try auth.signOut()
            print("✅ User logged out successfully")
        } catch {
            print("❌ Logout failed: \(error)")
        }
    }
    
    // MARK: - Firestore Operations
    
    /// Get user profile from Firestore
    private func getUserProfile(uid: String) async throws -> User? {
        let document = try await firestore.collection("users").document(uid).getDocument()
        
        guard document.exists, let data = document.data() else {
            return nil
        }
        
        // Get current Firebase user for additional info
        guard let firebaseUser = auth.currentUser else {
            return nil
        }
        
        return User(from: firebaseUser, additionalData: data)
    }
    
    /// Create new user profile in Firestore
    private func createUserProfile(user: User) async throws {
        let userRef = firestore.collection("users").document(user.id)
        var userData = user.toDictionary()
        userData["chatSessionId"] = "user-session-\(user.id)-\(Int(Date().timeIntervalSince1970))"
        
        try await userRef.setData(userData, merge: true)
        print("💾 User profile saved to Firestore")
    }
    
    /// Update last login timestamp
    private func updateLastLogin(for uid: String) async throws {
        let userRef = firestore.collection("users").document(uid)
        try await userRef.updateData([
            "lastLogin": Timestamp(date: Date())
        ])
    }
    
    /// Check if user has completed onboarding
    private func checkOnboardingStatus(for uid: String) async -> Bool {
        do {
            // Check if personality profile exists
            let personalityDoc = try await firestore
                .collection("personalityProfiles")
                .document(uid)
                .getDocument()
            
            return personalityDoc.exists
        } catch {
            print("❌ Error checking onboarding status: \(error)")
            return false
        }
    }
    
    // MARK: - Chat Session Management
    
    /// Get or create chat session ID
    func getChatSessionId() async -> String {
        if let user = currentUser, let sessionId = user.chatSessionId {
            return sessionId
        }
        
        // Create new session ID
        let sessionId = "user-session-\(currentUser?.id ?? "anonymous")-\(Int(Date().timeIntervalSince1970))"
        
        // Update in Firestore if user exists
        if let uid = currentUser?.id {
            do {
                try await firestore.collection("users").document(uid).updateData([
                    "chatSessionId": sessionId
                ])
            } catch {
                print("❌ Error updating chat session ID: \(error)")
            }
        }
        
        return sessionId
    }
    
    // MARK: - Password Reset
    
    /// Send password reset email
    func sendPasswordReset(email: String) async -> AuthResult {
        do {
            try await auth.sendPasswordReset(withEmail: email)
            return AuthResult.success(with: nil, message: "Password reset email sent!")
        } catch {
            return AuthResult.failure(message: error.localizedDescription)
        }
    }
}