export const printComponent = (htmlContent: string) => {
  // 1. Tentar abrir em nova janela (contorna o bloqueio de modal do iframe em alguns casos)
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      let styles = '';
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
        styles += el.outerHTML;
      });

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Impressão - Ohana Clean</title>
            ${styles}
            <style>
              body { background: white !important; margin: 0; padding: 20px; }
              @page { size: A4; margin: 10mm; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${htmlContent}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  setTimeout(() => {
                    window.close();
                  }, 500);
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return; // Sucesso na nova janela
    }
  } catch (e) {
    console.warn("Não foi possível abrir nova janela para impressão", e);
  }

  // 2. Se falhar (popup bloqueado ou erro), tenta na mesma janela
  const printContainer = document.createElement('div');
  printContainer.id = 'print-container';
  printContainer.innerHTML = htmlContent;
  
  document.body.appendChild(printContainer);
  document.body.classList.add('printing');
  
  setTimeout(() => {
    try {
      window.print();
    } catch (e) {
      console.error("Erro ao imprimir", e);
    }
    
    document.body.classList.remove('printing');
    document.body.removeChild(printContainer);

    // 3. Se estiver em um iframe (como no preview do AI Studio), avisa o usuário
    if (window.self !== window.top) {
      const warning = document.createElement('div');
      warning.style.position = 'fixed';
      warning.style.bottom = '20px';
      warning.style.right = '20px';
      warning.style.backgroundColor = '#ef4444';
      warning.style.color = 'white';
      warning.style.padding = '16px';
      warning.style.borderRadius = '8px';
      warning.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      warning.style.zIndex = '99999';
      warning.style.maxWidth = '320px';
      warning.style.fontFamily = 'sans-serif';
      warning.innerHTML = `
        <h4 style="font-weight: bold; margin-bottom: 8px; margin-top: 0;">Impressão Bloqueada pelo Navegador</h4>
        <p style="font-size: 14px; margin-bottom: 12px; line-height: 1.4;">
          O ambiente de pré-visualização bloqueia a impressão por segurança. 
          Para imprimir, clique no botão <strong>"Open in New Tab"</strong> (ícone de seta no canto superior direito da tela) para abrir o sistema em uma nova guia.
        </p>
        <button style="background: white; color: #ef4444; border: none; padding: 8px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; width: 100%;">Entendi</button>
      `;
      
      const btn = warning.querySelector('button');
      if (btn) {
        btn.onclick = () => document.body.removeChild(warning);
      }
      
      document.body.appendChild(warning);
      
      setTimeout(() => {
        if (document.body.contains(warning)) {
          document.body.removeChild(warning);
        }
      }, 15000);
    }
  }, 100);
};
