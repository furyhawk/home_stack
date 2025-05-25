import {
  loginLoginAccessToken,
  loginRecoverPassword,
  loginResetPassword,
} from "../sdk.gen"

/**
 * LoginService provides an object-oriented interface to the login-related APIs
 */
class LoginService {
  /**
   * OAuth2 compatible token login, get an access token for future requests
   *
   * @param username Username
   * @param password Password
   * @returns Promise with the login response
   */
  static async loginAccessToken(username: string, password: string) {
    return await loginLoginAccessToken({
      data: {
        username,
        password,
      },
    })
  }

  /**
   * Recover password
   *
   * @param email Email
   * @returns Promise with the recovery response
   */
  static async recoverPassword(email: string) {
    return await loginRecoverPassword({
      data: {
        email,
      },
    })
  }

  /**
   * Reset password
   *
   * @param token Reset token
   * @param newPassword New password
   * @returns Promise with the reset response
   */
  static async resetPassword(token: string, newPassword: string) {
    return await loginResetPassword({
      data: {
        token,
        new_password: newPassword,
      },
    })
  }
}

export default LoginService
