## внутри Docker Compose (6 узлов)


## Nginx
                             
	  image: nginx:alpine                
	  ports: 80, 443                     
	  proxy: /api → backend:3000         
	  proxy: / → frontend/dist         
	  proxy: metabase.* → metabase:3000  
	  SSL termination                    
	  volume: ./nginx/nginx.conf         
	  volume: ./frontend/dist            
	  volume: /etc/letsencrypt           
## BACKEND

	 image: node:20-alpine (build)      
	port: 3000 (только внутри сети)    
	Express + JWT + pg Pool            
	 CORS: * (открыт для всех)          
	 volume: ./backend:/app  ← dev-mode 
	 CMD: npm run dev (nodemon)         
	 health: /api/ping       


## PostgreSQL

	image: postgres:15-alpine          
	port: 127.0.0.1:5432               
	DB: zeus_auto_db                   
	user: zeus_user                    
	tables: users, visits, services, refresh_tokens, shifts              
	volume: postgres_data              
	wal_level: minimal                 
	archive_mode: OFF            


## MetaBase

	image: metabase:latest             
	port: 127.0.0.1:3001             
	 DB: metabase_db (в той же Postgres)
	volume: metabase_data              
	 JAVA_OPTS: не заданы               
	profile: metabase                  

