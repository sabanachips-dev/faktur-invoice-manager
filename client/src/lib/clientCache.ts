export function reconcileCreatedClient<T extends { id: number }>(
  current: T[] | undefined,
  temporaryId: number,
  created: T,
) {
  if (!current?.length) return [created];
  return current.map(item => item.id === temporaryId ? created : item);
}

