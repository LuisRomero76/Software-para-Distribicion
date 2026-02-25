import { useState, useMemo, useRef } from 'react'

export type SortDir = 'asc' | 'desc'

export interface SortState {
  key: string
  dir: SortDir
}

/**
 * Hook reutilizable para ordenar tablas por columna (ascendente/descendente).
 * @param data - Array de datos ya filtrado.
 * @param getField - Función opcional para obtener el valor de un campo (útil para campos anidados).
 * @returns sorted, sort, handleSort
 */
export function useSorting<T>(
  data: T[],
  getField?: (item: T, key: string) => any
) {
  // Guardamos la función en un ref para no recrear useMemo al cambiar la referencia del callback
  const getFieldRef = useRef(getField)
  getFieldRef.current = getField

  const [sort, setSort] = useState<SortState | null>(null)

  const handleSort = (key: string) => {
    setSort(prev =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
  }

  const sorted = useMemo(() => {
    if (!sort) return data
    const accessor = getFieldRef.current ?? ((item: T, k: string) => (item as any)[k])
    return [...data].sort((a, b) => {
      const aVal = accessor(a, sort.key)
      const bVal = accessor(b, sort.key)
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal, 'es', { sensitivity: 'base' })
        return sort.dir === 'asc' ? cmp : -cmp
      }
      if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1
      if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sort])

  return { sorted, sort, handleSort }
}
