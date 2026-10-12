export async function handlePdfBlob(response, { filename, preview = false } = {}) {
  const blob = (response && response.data instanceof Blob)
    ? response.data
    : (response instanceof Blob
      ? response
      : new Blob([response?.data || response], { type: 'application/pdf' }));
  const url = URL.createObjectURL(blob);

  if (preview) {
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return url;
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'report.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return url;
}
