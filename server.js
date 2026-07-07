const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const crypto = require('crypto');
const https = require('https');

// Função de Hashing SHA-256 para cumprir os requisitos de privacidade da Meta
function sha256(text) {
  if (!text) return null;
  return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

// Enviar evento de servidor para a API de Conversões da Meta (CAPI)
function sendMetaConversionEvent(eventName, userData, sourceUrl) {
  const PIXEL_ID = process.env.META_PIXEL_ID || '3374358562732931';
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  
  if (!ACCESS_TOKEN) {
    console.log(`[Meta CAPI] Evento ${eventName} simulado localmente (Sem META_ACCESS_TOKEN configurado).`);
    return;
  }

  const payload = JSON.stringify({
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: sourceUrl || '',
        action_source: 'website',
        user_data: {
          em: userData.email ? [sha256(userData.email)] : [],
          fn: userData.name ? [sha256(userData.name)] : []
        }
      }
    ]
  });

  const options = {
    hostname: 'graph.facebook.com',
    path: `/v17.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log(`[Meta CAPI] Status: ${res.statusCode}. Resposta:`, body);
    });
  });

  req.on('error', (e) => {
    console.error('[Meta CAPI] Erro ao enviar evento:', e.message);
  });

  req.write(payload);
  req.end();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Servir o Painel Administrativo de forma explícita na rota /admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ==========================================
// API ENDPOINTS
// ==========================================

// Obter o preço configurado atualmente
app.get('/api/price', (req, res) => {
  try {
    const config = db.getConfig();
    res.json({ price: config.productPrice });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar o preço do produto' });
  }
});

// Cadastrar um novo Lead (Interesse)
app.post('/api/leads', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' });
  }
  
  try {
    const newLead = db.addLead({ name, email });
    
    // Meta Conversions API (Server-side)
    const sourceUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    sendMetaConversionEvent('Lead', { email, name }, sourceUrl);
    
    res.status(201).json({ message: 'Lead capturado com sucesso!', lead: newLead });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno ao salvar lead' });
  }
});

// Processar checkout simulado de compra (Acesso Vitalício)
app.post('/api/checkout', (req, res) => {
  const { name, email, phone, method } = req.body;
  
  if (!name || !email || !phone || !method) {
    return res.status(400).json({ error: 'Todos os campos do checkout são obrigatórios' });
  }

  try {
    // Obter o preço oficial configurado no banco de dados para evitar fraudes
    const config = db.getConfig();
    const amount = config.productPrice;

    // Gerar credenciais fictícias de acesso à área de membros
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '');
    const accessUser = email.trim().toLowerCase();
    const accessPass = 'forte_' + Math.floor(1000 + Math.random() * 9000);

    // Adicionar venda no banco de dados
    const newSale = db.addSale({
      name,
      email,
      phone,
      method,
      amount,
      status: method === 'boleto' ? 'pendente' : 'aprovado',
      accessUser,
      accessPass
    });

    res.status(201).json({
      message: 'Compra simulada processada com sucesso!',
      sale: newSale,
      access: {
        user: accessUser,
        pass: accessPass,
        link: 'https://membros.cabeloforte.com/login'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar compra simulada' });
  }
});

// Obter métricas e dados detalhados para o Painel Admin
app.get('/api/admin/stats', (req, res) => {
  try {
    const sales = db.getSales();
    const leads = db.getLeads();
    const config = db.getConfig();

    // Calcular receita total de vendas APROVADAS
    const totalRevenue = sales
      .filter(sale => sale.status === 'aprovado')
      .reduce((sum, sale) => sum + parseFloat(sale.amount), 0);

    const salesCount = sales.length;
    const leadsCount = leads.length;

    res.json({
      totalRevenue,
      salesCount,
      leadsCount,
      productPrice: config.productPrice,
      sales,
      leads
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar métricas do administrador' });
  }
});

// Atualizar configuração (Preço do Produto)
app.post('/api/admin/config', (req, res) => {
  const { productPrice } = req.body;

  if (productPrice === undefined || isNaN(parseFloat(productPrice)) || parseFloat(productPrice) <= 0) {
    return res.status(400).json({ error: 'Preço inválido' });
  }

  try {
    const updatedConfig = db.updateConfig({ productPrice: parseFloat(productPrice) });
    res.json({ message: 'Configuração atualizada com sucesso!', config: updatedConfig });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar configuração' });
  }
});

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Servidor Cabelo Forte rodando com sucesso!`);
  console.log(`👉 Acesse a Landing Page: http://localhost:${PORT}`);
  console.log(`👉 Acesse o Painel Admin: http://localhost:${PORT}/admin`);
  console.log(`=================================================`);
});
