export const authErrorMessage = (code, fallback) => {
  switch (code) {
    case 'account/deletion-pending':
      return 'Your account deletion is pending. Check your connection and try again to finish deleting it.'
    case 'auth/network-request-failed':
      return 'Check your connection and try again.'
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.'
    case 'auth/email-already-in-use':
      return 'This email already has an account. Log in or reset your password.'
    case 'auth/weak-password':
      return 'Choose a stronger password and try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.'
    default:
      return fallback
  }
}
