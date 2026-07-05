document.addEventListener('DOMContentLoaded', () => {
  // Alternância de Abas (Tabs)
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Busca estatísticas e popula as tabelas
  async function loadDashboardData() {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Erro ao buscar dados do painel');

      const data = await response.json();

      // Atualiza os cards com as métricas
      document.getElementById('stat-revenue').textContent = 'R$ ' + data.totalRevenue.toFixed(2).replace('.', ',');
      document.getElementById('stat-sales-count').textContent = data.salesCount;
      document.getElementById('stat-leads-count').textContent = data.leadsCount;
      document.getElementById('input-price').value = data.productPrice;

      // Popula a tabela de Vendas
      const salesBody = document.getElementById('sales-list-body');
      if (data.sales && data.sales.length > 0) {
        salesBody.innerHTML = '';
        data.sales.forEach(sale => {
          const dateStr = new Date(sale.createdAt).toLocaleString('pt-BR');
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${dateStr}</td>
            <td><strong>${sale.name}</strong></td>
            <td>
              <div>${sale.email}</div>
              <small style="color: var(--text-muted);">${sale.phone}</small>
            </td>
            <td><span class="sales-badge badge-${sale.method}">${sale.method.toUpperCase()}</span></td>
            <td>R$ ${parseFloat(sale.amount).toFixed(2).replace('.', ',')}</td>
            <td>
              <div class="sales-access">
                Usuário: ${sale.accessUser}<br>
                Senha: ${sale.accessPass}
              </div>
            </td>
          `;
          salesBody.appendChild(row);
        });
      } else {
        salesBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhuma venda registrada até o momento.</td></tr>`;
      }

      // Popula a tabela de Leads
      const leadsBody = document.getElementById('leads-list-body');
      if (data.leads && data.leads.length > 0) {
        leadsBody.innerHTML = '';
        data.leads.forEach(lead => {
          const dateStr = new Date(lead.createdAt).toLocaleString('pt-BR');
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${dateStr}</td>
            <td><strong>${lead.name}</strong></td>
            <td>${lead.email}</td>
          `;
          leadsBody.appendChild(row);
        });
      } else {
        leadsBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhum lead capturado até o momento.</td></tr>`;
      }

    } catch (error) {
      console.error('Erro ao carregar dados do admin:', error);
    }
  }

  // Inicializa o carregamento dos dados
  loadDashboardData();

  // Envio de formulário de alteração de preço
  const btnSavePrice = document.getElementById('btn-save-price');
  const inputPrice = document.getElementById('input-price');
  const priceStatus = document.getElementById('price-status');

  btnSavePrice.addEventListener('click', async () => {
    const newPrice = parseFloat(inputPrice.value);
    if (isNaN(newPrice) || newPrice <= 0) {
      priceStatus.textContent = 'Insira um valor válido maior que zero.';
      priceStatus.className = 'price-status-msg error';
      return;
    }

    try {
      priceStatus.textContent = 'Salvando...';
      priceStatus.className = 'price-status-msg';

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productPrice: newPrice })
      });

      if (!response.ok) throw new Error('Falha ao atualizar preço');

      priceStatus.textContent = 'Preço atualizado com sucesso!';
      priceStatus.className = 'price-status-msg success';
      
      setTimeout(() => {
        priceStatus.textContent = '';
        loadDashboardData();
      }, 2000);

    } catch (error) {
      console.error(error);
      priceStatus.textContent = 'Erro ao salvar. Tente novamente.';
      priceStatus.className = 'price-status-msg error';
    }
  });
});
