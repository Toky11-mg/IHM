export const storage = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token: string) => localStorage.setItem('token', token),
  removeToken: () => localStorage.removeItem('token'),

  getUser: () => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  },
  setUser: (user: object) =>
    localStorage.setItem('user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('user'),

  clear: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
}