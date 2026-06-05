## внутри Docker Compose (4 узлов)
## Nginx
	Аналогичен Prod, но другой домен   
	(dev.zeus-auto-service.ru) 


##  ⚙️ BACKEND and FRONTEND 
	Та же кодовая база, другая ветка 
	git (develop) 



##  POSTGRESQL 
	Изолированная БД 
	Данные ≠ Prod 

## Teletgram bot
	Прикрасный телеграм бот, который шлет отчеты (3 раза в день и раз в месяц)
## GitHub Runner
****Не в Docker! Работает на хосте****
	  self-hosted, label: zeus-dev
	 Делает: git pull → npm install 
	 → npm run build → docker compose  up --build -d  
