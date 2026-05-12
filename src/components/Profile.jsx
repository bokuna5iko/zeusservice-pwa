const Profile = () => {
    return (
      <div className="page active">
        <section className="card">
          <h3>Мой профиль</h3>
          <div className="profile-info" style={{margin: '20px 0'}}>
            <p><strong>Имя:</strong> Иван Иванов</p>
            <p><strong>Телефон:</strong> +7 (999) 000-00-00</p>
            <p><strong>Статус:</strong> Постоянный клиент</p>
          </div>
          <button className="btn-auth" style={{width: '100%', padding: '12px', background: '#ff4757', color: 'white', border: 'none', borderRadius: '8px'}}>
            Выйти из аккаунта
          </button>
        </section>
      </div>
    );
  };
  
  export default Profile;