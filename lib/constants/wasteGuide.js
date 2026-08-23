export const WASTE_TYPES = {
  campuran: {
    label: 'Limbah Campuran',
    seedsPerKg: 5000,
    harvestPercentMin: 40,
    harvestPercentMax: 50,
    tips: 'Pastikan kelembaban media berada di kisaran 60-70%. Aduk media setiap 2 hari agar tidak menggumpal dan mencegah pembusukan yang tidak merata.'
  },
  sayur_buah: {
    label: 'Sayur & Buah',
    seedsPerKg: 4000,
    harvestPercentMin: 45,
    harvestPercentMax: 55,
    tips: 'Cacah limbah hingga berukuran kurang dari 2cm untuk mempercepat proses dekomposisi. Hindari penggunaan jeruk/nanas secara berlebihan karena kadar asamnya dapat menghambat pertumbuhan larva.'
  },
  ampas_tahu: {
    label: 'Ampas Tahu',
    seedsPerKg: 6000,
    harvestPercentMin: 50,
    harvestPercentMax: 60,
    tips: 'Peras kadar air ampas tahu hingga di bawah 70%. Campurkan sedikit dedak padi untuk menjaga keseimbangan nutrisi dan mencegah media menjadi terlalu basah.'
  }
}

export function calculateFeed(wasteWeightKg, wasteType) {
  const config = WASTE_TYPES[wasteType]
  if (!config || !wasteWeightKg || wasteWeightKg <= 0) return null
  const estimatedSeeds = Math.round(wasteWeightKg * config.seedsPerKg)
  const harvestMin = Number((wasteWeightKg * (config.harvestPercentMin / 100)).toFixed(2))
  const harvestMax = Number((wasteWeightKg * (config.harvestPercentMax / 100)).toFixed(2))
  return {
    estimatedSeeds,
    harvestMin,
    harvestMax,
    tips: config.tips,
    label: config.label
  }
}

export const FAILURE_REASONS = [
  { value: 'hama', label: 'Hama' },
  { value: 'cuaca', label: 'Cuaca' },
  { value: 'kualitas_pakan', label: 'Kualitas Pakan' },
  { value: 'kontaminasi', label: 'Kontaminasi' },
  { value: 'lainnya', label: 'Lainnya' }
]
