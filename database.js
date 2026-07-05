const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

// Inicializa o arquivo JSON com a estrutura padrão caso ele não exista
function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    const defaultDb = {
      leads: [],
      sales: [],
      config: {
        productPrice: 37.90
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
  }
}

// Lê o estado atual do banco de dados
function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler o banco de dados JSON:', error);
    return { leads: [], sales: [], config: { productPrice: 37.90 } };
  }
}

// Grava as informações de volta no arquivo
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erro ao gravar no banco de dados JSON:', error);
    return false;
  }
}

module.exports = {
  getLeads: () => readDb().leads,
  
  addLead: (lead) => {
    const db = readDb();
    const newLead = {
      id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      ...lead
    };
    db.leads.unshift(newLead);
    writeDb(db);
    return newLead;
  },
  
  getSales: () => readDb().sales,
  
  addSale: (sale) => {
    const db = readDb();
    const newSale = {
      id: 'sale_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      ...sale
    };
    db.sales.unshift(newSale);
    writeDb(db);
    return newSale;
  },
  
  getConfig: () => readDb().config,
  
  updateConfig: (newConfig) => {
    const db = readDb();
    db.config = { ...db.config, ...newConfig };
    writeDb(db);
    return db.config;
  }
};
