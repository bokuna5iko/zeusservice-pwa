const Admin = () => {
    return (
      <div className="page active">
        <section className="card">
          <h3>Панель администратора</h3>
          <div className="admin-stats" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px'}}>
            <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center'}}>
              <div style={{fontSize: '0.8rem', color: '#666'}}>За сегодня</div>
              <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>12</div>
            </div>
            <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center'}}>
              <div style={{fontSize: '0.8rem', color: '#666'}}>Выручка</div>
              <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>14 400₽</div>
            </div>
          </div>
          <button className="btn-auth" style={{width: '100%', marginTop: '20px'}}>
            Открыть сканер QR
          </button>
        </section>
      </div>
    );
  };
  
  export default Admin;