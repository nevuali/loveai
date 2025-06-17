import Foundation
import Firebase

// MARK: - User Model
struct User: Codable, Identifiable {
    let id: String // Firebase UID
    let email: String
    var displayName: String?
    var photoURL: String?
    var phoneNumber: String?
    
    // Custom fields matching your React app
    var name: String
    var surname: String?
    var isVerified: Bool
    var isPremium: Bool
    var messageCount: Int
    var totalSpent: Double
    var reservationCount: Int
    var chatSessionId: String?
    var createdAt: Date
    var lastLogin: Date
    
    // MARK: - Computed Properties
    var fullName: String {
        if let surname = surname, !surname.isEmpty {
            return "\(name) \(surname)"
        }
        return name
    }
    
    var initials: String {
        let firstInitial = String(name.prefix(1)).uppercased()
        let lastInitial = surname?.prefix(1).uppercased() ?? ""
        return firstInitial + lastInitial
    }
    
    // MARK: - Initializers
    init(id: String, email: String, name: String, surname: String? = nil) {
        self.id = id
        self.email = email
        self.name = name
        self.surname = surname
        self.displayName = "\(name) \(surname ?? "")"
        self.isVerified = false
        self.isPremium = false
        self.messageCount = 0
        self.totalSpent = 0.0
        self.reservationCount = 0
        self.createdAt = Date()
        self.lastLogin = Date()
    }
    
    // Firebase User'dan dönüştürme
    init(from firebaseUser: Firebase.User, additionalData: [String: Any] = [:]) {
        self.id = firebaseUser.uid
        self.email = firebaseUser.email ?? ""
        self.displayName = firebaseUser.displayName
        self.photoURL = firebaseUser.photoURL?.absoluteString
        self.phoneNumber = firebaseUser.phoneNumber
        
        // Parse additional data from Firestore
        self.name = additionalData["name"] as? String ?? 
                   firebaseUser.displayName?.components(separatedBy: " ").first ?? "User"
        self.surname = additionalData["surname"] as? String ?? 
                      firebaseUser.displayName?.components(separatedBy: " ").dropFirst().joined(separator: " ")
        self.isVerified = additionalData["isVerified"] as? Bool ?? firebaseUser.isEmailVerified
        self.isPremium = additionalData["isPremium"] as? Bool ?? false
        self.messageCount = additionalData["messageCount"] as? Int ?? 0
        self.totalSpent = additionalData["totalSpent"] as? Double ?? 0.0
        self.reservationCount = additionalData["reservationCount"] as? Int ?? 0
        self.chatSessionId = additionalData["chatSessionId"] as? String
        
        // Handle Firestore Timestamps
        if let timestamp = additionalData["createdAt"] as? Timestamp {
            self.createdAt = timestamp.dateValue()
        } else {
            self.createdAt = Date()
        }
        
        if let timestamp = additionalData["lastLogin"] as? Timestamp {
            self.lastLogin = timestamp.dateValue()
        } else {
            self.lastLogin = Date()
        }
    }
}

// MARK: - User Extensions
extension User {
    // Firestore'a kaydetmek için dictionary dönüştürme
    func toDictionary() -> [String: Any] {
        return [
            "email": email,
            "displayName": displayName ?? "",
            "name": name,
            "surname": surname ?? "",
            "photoURL": photoURL ?? "",
            "phoneNumber": phoneNumber ?? "",
            "isVerified": isVerified,
            "isPremium": isPremium,
            "messageCount": messageCount,
            "totalSpent": totalSpent,
            "reservationCount": reservationCount,
            "chatSessionId": chatSessionId ?? "",
            "createdAt": Timestamp(date: createdAt),
            "lastLogin": Timestamp(date: lastLogin)
        ]
    }
}

// MARK: - Authentication Models
struct LoginCredentials {
    let email: String
    let password: String
}

struct RegisterData {
    let name: String
    let surname: String?
    let email: String
    let password: String
    let phone: String?
}

// MARK: - Auth Result
struct AuthResult {
    let success: Bool
    let user: User?
    let message: String
    let errorCode: String?
    
    static func success(with user: User, message: String = "Authentication successful") -> AuthResult {
        return AuthResult(success: true, user: user, message: message, errorCode: nil)
    }
    
    static func failure(message: String, errorCode: String? = nil) -> AuthResult {
        return AuthResult(success: false, user: nil, message: message, errorCode: errorCode)
    }
}