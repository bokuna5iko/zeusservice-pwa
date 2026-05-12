const History = () => {
    const visits = [
      { id: 1, date: '10 мая, 14:20', service: 'Комплекс', price: '1200₽' },
      { id: 2, date: '3 мая, 10:15', service: 'Экспресс', price: '600₽' },
    ];
  
    return (
      <div className="page active">
        <section className="card">
          <h3>История визитов</h3>
          <div className="history-list">
            {visits.map(visit => (
              <div key={visit.id} className="history-item" style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee'}}>
                <div>
                  <div style={{fontWeight: 'bold'}}>{visit.service}</div>
                  <div style={{fontSize: '0.8rem', color: '#666'}}>{visit.date}</div>
                </div>
                <div style={{fontWeight: 'bold', color: '#1e3c72'}}>{visit.price}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };
  
  export default History;