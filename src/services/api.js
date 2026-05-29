export const enviarFormulario = async (data) => {
  const url = "https://brunon8nv.app.n8n.cloud/webhook/formulario"
  
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