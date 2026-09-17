/** Read intrinsic dimensions without changing any pixels or jewelry geometry. */
export async function mediaDimensions(file: File): Promise<{width:number;height:number}> {
  // Files are rendered as download links, not images; dimensions are a sentinel.
  if (file.type === 'application/pdf') return {width:1,height:1};
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve,reject) => {
      if (file.type === 'video/mp4') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => resolve({width:video.videoWidth,height:video.videoHeight});
        video.onerror = () => reject(new Error('Unable to read video metadata.'));
        video.src = url;
      } else {
        const image = new Image();
        image.onload = () => resolve({width:image.naturalWidth,height:image.naturalHeight});
        image.onerror = () => reject(new Error('Unable to decode image.'));
        image.src = url;
      }
    });
  } finally { URL.revokeObjectURL(url); }
}
