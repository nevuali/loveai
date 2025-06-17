import SwiftUI

struct AuthPage: View {
    
    // MARK: - State Objects
    @StateObject private var authService = AuthService.shared
    @State private var isSignUp = false
    @State private var showPassword = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    
    // MARK: - Form Data
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var surname = ""
    
    // MARK: - Color Scheme
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Background Gradient
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(.systemBackground),
                        Color.pink.opacity(0.1),
                        Color.purple.opacity(0.05)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                // Floating Background Elements
                backgroundElements
                
                ScrollView {
                    VStack(spacing: 0) {
                        Spacer(minLength: 60)
                        
                        // Logo Section
                        logoSection
                        
                        // Main Heading
                        headingSection
                        
                        // Auth Form
                        authForm
                        
                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, 24)
                }
            }
        }
        .alert(alertMessage, isPresented: $showAlert) {
            Button("OK", role: .cancel) { }
        }
    }
    
    // MARK: - Background Elements
    private var backgroundElements: some View {
        ZStack {
            // Floating circles
            Circle()
                .fill(Color.pink.opacity(0.2))
                .frame(width: 200, height: 200)
                .blur(radius: 40)
                .offset(x: -100, y: -200)
                .animation(.easeInOut(duration: 6).repeatForever(autoreverses: true), value: isSignUp)
            
            Circle()
                .fill(Color.purple.opacity(0.15))
                .frame(width: 300, height: 300)
                .blur(radius: 50)
                .offset(x: 120, y: 300)
                .animation(.easeInOut(duration: 8).repeatForever(autoreverses: true), value: isSignUp)
            
            Circle()
                .fill(Color.pink.opacity(0.1))
                .frame(width: 250, height: 250)
                .blur(radius: 45)
                .offset(x: 0, y: 100)
                .animation(.easeInOut(duration: 7).repeatForever(autoreverses: true), value: isSignUp)
        }
    }
    
    // MARK: - Logo Section
    private var logoSection: some View {
        VStack(spacing: 16) {
            ZStack {
                // Background glow
                Circle()
                    .fill(Color.pink.opacity(0.2))
                    .frame(width: 80, height: 80)
                    .blur(radius: 20)
                
                // Main logo circle
                Circle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.pink, Color.purple]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 64, height: 64)
                    .overlay(
                        Image(systemName: "heart.fill")
                            .font(.system(size: 28))
                            .foregroundColor(.white)
                    )
                    .shadow(color: .pink.opacity(0.3), radius: 10, x: 0, y: 5)
            }
            
            // App name
            HStack(spacing: 4) {
                Text("AI")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Text("LOVVE")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.pink, Color.purple]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
            }
        }
        .padding(.bottom, 40)
    }
    
    // MARK: - Heading Section
    private var headingSection: some View {
        VStack(spacing: 16) {
            VStack(spacing: 8) {
                Text(isSignUp ? "Create your account" : "Your ideas,")
                    .font(.system(size: 36, weight: .regular))
                    .foregroundColor(.primary)
                
                Text(isSignUp ? "to begin planning" : "amplified")
                    .font(.system(size: 36, weight: .regular))
                    .foregroundColor(.primary)
            }
            
            Text("Privacy-first AI that helps you create romantic experiences with confidence.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .lineLimit(nil)
        }
        .padding(.bottom, 40)
    }
    
    // MARK: - Auth Form
    private var authForm: some View {
        VStack(spacing: 16) {
            // Name fields for sign up
            if isSignUp {
                HStack(spacing: 12) {
                    CustomTextField(
                        placeholder: "First name",
                        text: $name
                    )
                    
                    CustomTextField(
                        placeholder: "Last name",
                        text: $surname
                    )
                }
            }
            
            // Email field
            CustomTextField(
                placeholder: "Enter your email address",
                text: $email,
                keyboardType: .emailAddress
            )
            
            // Password field
            CustomPasswordField(
                placeholder: isSignUp ? "Create a password" : "Enter your password",
                text: $password,
                showPassword: $showPassword
            )
            
            // Submit button
            submitButton
            
            // Forgot password (only for sign in)
            if !isSignUp {
                forgotPasswordButton
            }
            
            // Switch between sign in/up
            switchModeButton
            
            // Footer
            footerSection
        }
    }
    
    // MARK: - Submit Button
    private var submitButton: some View {
        Button(action: {
            Task {
                await handleSubmit()
            }
        }) {
            HStack {
                if authService.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                    
                    Text(isSignUp ? "Creating Account..." : "Signing In...")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white)
                } else {
                    Text(isSignUp ? "✨ Create Account" : "🔐 Sign In")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
                LinearGradient(
                    gradient: Gradient(colors: [Color.pink, Color.purple]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(Capsule())
            .shadow(color: .pink.opacity(0.3), radius: 10, x: 0, y: 5)
            .scaleEffect(authService.isLoading ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: authService.isLoading)
        }
        .disabled(authService.isLoading || !isFormValid)
        .opacity(isFormValid ? 1.0 : 0.6)
        .padding(.top, 8)
    }
    
    // MARK: - Forgot Password Button
    private var forgotPasswordButton: some View {
        Button(action: {
            Task {
                await handleForgotPassword()
            }
        }) {
            Text("Forgot your password?")
                .font(.system(size: 14))
                .foregroundColor(.secondary)
        }
        .padding(.top, 8)
    }
    
    // MARK: - Switch Mode Button
    private var switchModeButton: some View {
        VStack(spacing: 8) {
            HStack(spacing: 4) {
                Text(isSignUp ? "Already have an account?" : "Don't have an account?")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        isSignUp.toggle()
                        clearForm()
                    }
                }) {
                    Text(isSignUp ? "Sign In" : "Sign Up")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.pink)
                        .underline()
                }
                .disabled(authService.isLoading)
            }
        }
        .padding(.top, 24)
    }
    
    // MARK: - Footer Section
    private var footerSection: some View {
        VStack {
            Spacer(minLength: 60)
            
            Text("By continuing, you acknowledge AI LOVVE's **Privacy Policy**.")
                .font(.system(size: 12))
                .foregroundColor(.tertiary)
                .multilineTextAlignment(.center)
        }
    }
    
    // MARK: - Computed Properties
    private var isFormValid: Bool {
        let emailValid = !email.isEmpty && email.contains("@")
        let passwordValid = !password.isEmpty
        let nameValid = isSignUp ? !name.isEmpty : true
        
        return emailValid && passwordValid && nameValid
    }
    
    // MARK: - Functions
    private func handleSubmit() async {
        let result: AuthResult
        
        if isSignUp {
            let registerData = RegisterData(
                name: name,
                surname: surname.isEmpty ? nil : surname,
                email: email,
                password: password,
                phone: nil
            )
            result = await authService.register(data: registerData)
        } else {
            let credentials = LoginCredentials(email: email, password: password)
            result = await authService.login(credentials: credentials)
        }
        
        if result.success {
            // Navigation will be handled by AuthService state change
            print("✅ Authentication successful")
        } else {
            alertMessage = result.message
            showAlert = true
        }
    }
    
    private func handleForgotPassword() async {
        guard !email.isEmpty else {
            alertMessage = "Please enter your email address first"
            showAlert = true
            return
        }
        
        let result = await authService.sendPasswordReset(email: email)
        alertMessage = result.message
        showAlert = true
    }
    
    private func clearForm() {
        email = ""
        password = ""
        name = ""
        surname = ""
    }
}

// MARK: - Custom Text Field
struct CustomTextField: View {
    let placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    
    var body: some View {
        TextField(placeholder, text: $text)
            .keyboardType(keyboardType)
            .autocapitalization(.none)
            .disableAutocorrection(true)
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color(.systemGray4), lineWidth: 1)
            )
    }
}

// MARK: - Custom Password Field
struct CustomPasswordField: View {
    let placeholder: String
    @Binding var text: String
    @Binding var showPassword: Bool
    
    var body: some View {
        HStack {
            Group {
                if showPassword {
                    TextField(placeholder, text: $text)
                } else {
                    SecureField(placeholder, text: $text)
                }
            }
            .autocapitalization(.none)
            .disableAutocorrection(true)
            
            Button(action: {
                showPassword.toggle()
            }) {
                Image(systemName: showPassword ? "eye.slash" : "eye")
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 16)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(.systemGray4), lineWidth: 1)
        )
    }
}

// MARK: - Preview
#Preview {
    AuthPage()
}