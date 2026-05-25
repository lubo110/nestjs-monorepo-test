export type LeadName = 'I' | 'II' | 'III' | 'aVR' | 'aVL' | 'aVF'

export type LeadsData = {
  [key in LeadName]: number[]
}
