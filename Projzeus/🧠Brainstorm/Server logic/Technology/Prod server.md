## внутри Docker Compose (6 узлов)



  ##  NGINX                           
  image: nginx:alpine                
  ports: 80, 443                     
  proxy: /api → backend:3000         
  proxy: / → frontend/dist         
  proxy: metabase.* → metabase:3000  
  SSL termination                    
  volume: ./nginx/nginx.conf         
  volume: ./frontend/dist            
  volume: /etc/letsencrypt           
