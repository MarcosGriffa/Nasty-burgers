@echo off
REM ===========================================================================
REM  NASTY BURGERS - Sistema del local con impresion directa
REM
REM  Abre el sistema en Chrome con la impresion silenciosa activada: cuando el
REM  empleado toca "Aceptar pedido", la comanda sale por la impresora
REM  PREDETERMINADA de Windows sin mostrar ningun cuadro de dialogo.
REM
REM  QUE HAY QUE HACER UNA SOLA VEZ:
REM   1) Instalar la termica en Windows y dejarla como impresora
REM      PREDETERMINADA (Configuracion > Bluetooth y dispositivos > Impresoras).
REM   2) Editar la linea DIRECCION de abajo y poner la direccion del sistema.
REM   3) Mandar este archivo al escritorio como acceso directo y abrir
REM      el sistema SIEMPRE desde aca.
REM ===========================================================================

REM --- Poner aca la direccion del sistema -----------------------------------
REM  Si esta publicado en internet:
REM      set DIRECCION=https://nastyburgers.vercel.app/#/panel
REM  Si es el archivo suelto en la PC (ojo con las barras /):
REM      set DIRECCION=file:///C:/Users/marqu/Downloads/nasty-sistema-local.html
REM  Ojo: los espacios de la ruta se escriben %%20  (Fotos%%20Fudo)

set DIRECCION=file:///C:/Users/marqu/OneDrive/Escritorio/Fotos%20Fudo/nasty-sistema-local.html

REM --------------------------------------------------------------------------

set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

if not exist %CHROME% (
  echo No encontre Chrome en esta PC.
  echo Instalalo desde google.com/chrome y volve a probar.
  pause
  exit /b 1
)

REM  --kiosk-printing     imprime sin preguntar, a la impresora predeterminada
REM  --user-data-dir      perfil aparte, para no tocar el Chrome de todos los dias
REM  --app                sin barra de direcciones: queda como un programa

start "" %CHROME% ^
  --kiosk-printing ^
  --user-data-dir="%LOCALAPPDATA%\NastyBurgers\chrome" ^
  --app="%DIRECCION%"
