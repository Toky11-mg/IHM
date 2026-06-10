export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

export const formatNote = (note?: number) =>
  note !== undefined ? note.toFixed(2) : '—'

export const getMention = (moyenne: number): string => {
  if (moyenne >= 16) return 'Très Bien'
  if (moyenne >= 14) return 'Bien'
  if (moyenne >= 12) return 'Assez Bien'
  if (moyenne >= 10) return 'Passable'
  return 'Insuffisant'
}

export const getDecision = (moyenne: number): string => {
  if (moyenne >= 10) return 'Admis'
  if (moyenne >= 8) return 'Rattrapage'
  return 'Ajourné'
}