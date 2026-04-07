export interface RecordMetadata {
  title: string;
  artist: string;
  category: string;
  coverUrl: string;
}

export async function fetchRecordMetadata(barcode: string): Promise<RecordMetadata | null> {
  try {
    const response = await fetch(`/api/lookup?barcode=${encodeURIComponent(barcode)}`);
    if (!response.ok) {
      console.error('Failed to fetch metadata from API');
      return null;
    }
    return await response.json() as RecordMetadata;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}
