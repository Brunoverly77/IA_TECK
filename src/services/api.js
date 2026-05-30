export const enviarFormulario = async (data) => {
  const url = import.meta.env.VITE_WEBHOOK_URL
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Erro na rede');
  }
  
  return response.json();
};