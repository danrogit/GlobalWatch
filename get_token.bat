@echo off
curl.exe -X POST "https://acleddata.com/oauth/token" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "username=hello@danro.dk" ^
  -d "password=7Z5p4Z7oiMmDX9jxKBL5ePBNKdqkJa" ^
  -d "grant_type=password" ^
  -d "client_id=acled" > token.json
