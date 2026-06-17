export const storage = {
  getToken: () => localStorage.getItem('eni_token'),
  setToken: (token: string) => localStorage.setItem('eni_token', token),
  removeToken: () => localStorage.removeItem('eni_token'),

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