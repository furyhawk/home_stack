// This is a temporary file to ensure the build process succeeds
// It provides minimal functionality for the client API

export const LoginService = {
  loginAccessToken: async () => ({
    success: false,
    error: "API not available",
  }),
  recoverPassword: async () => ({ success: false, error: "API not available" }),
  resetPassword: async () => ({ success: false, error: "API not available" }),
}

export const UsersService = {
  readUsers: async () => ({
    success: false,
    data: [],
    error: "API not available",
  }),
  readUserMe: async () => ({ success: false, error: "API not available" }),
  updateUserMe: async () => ({ success: false, error: "API not available" }),
  updatePassword: async () => ({ success: false, error: "API not available" }),
  deleteUser: async () => ({ success: false, error: "API not available" }),
}

export const ItemsService = {
  readItems: async () => ({
    success: false,
    data: [],
    error: "API not available",
  }),
  createItem: async () => ({ success: false, error: "API not available" }),
  updateItem: async () => ({ success: false, error: "API not available" }),
  deleteItem: async () => ({ success: false, error: "API not available" }),
}

// Provide basic error types
export const ApiError = Error

// Basic types
export const BodyLoginLoginAccessToken = {}
