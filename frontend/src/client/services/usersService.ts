import { 
  usersReadUsers,
  usersReadUserMe,
  usersUpdateUserMe,
  usersUpdatePasswordMe,
  usersDeleteUser,
  usersRegisterUser
} from '../sdk.gen';

/**
 * UsersService provides an object-oriented interface to the user-related APIs
 */
class UsersService {
  /**
   * Get list of users
   * 
   * @param skip Number of users to skip
   * @param limit Max number of users to return
   * @returns Promise with the users
   */
  static async readUsers(skip?: number, limit?: number) {
    return await usersReadUsers({
      params: {
        skip,
        limit
      }
    });
  }

  /**
   * Get current user
   * 
   * @returns Promise with the current user data
   */
  static async readUserMe() {
    return await usersReadUserMe({});
  }

  /**
   * Update current user
   * 
   * @param data User data to update
   * @returns Promise with the updated user data
   */
  static async updateUserMe(data: any) {
    return await usersUpdateUserMe({
      data
    });
  }

  /**
   * Update password
   * 
   * @param currentPassword Current password
   * @param newPassword New password
   * @returns Promise with the update result
   */
  static async updatePassword(currentPassword: string, newPassword: string) {
    return await usersUpdatePasswordMe({
      data: {
        current_password: currentPassword,
        new_password: newPassword
      }
    });
  }

  /**
   * Delete user
   * 
   * @param userId User ID to delete
   * @returns Promise with the deletion result
   */
  static async deleteUser(userId: string) {
    return await usersDeleteUser({
      params: {
        user_id: userId
      }
    });
  }

  /**
   * Register new user
   * 
   * @param data User registration data
   * @returns Promise with the registration result
   */
  static async registerUser(data: any) {
    return await usersRegisterUser({
      data
    });
  }
}

export default UsersService;
