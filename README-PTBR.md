# AULA F99 Noctis / ABNT2 — fix SignalRGB para `0xC3`

Correção comunitária testada em um **AULA F99 Noctis ABNT2** que aparecia no SignalRGB apenas como **“Sinowealth Device”**.

## Hardware testado

- Modelo: **AULA F99 Noctis**
- Layout: **ABNT2**
- USB VID:PID: **`258A:010C`**
- Device/model ID interno SinoWealth: **`195` decimal / `0xC3`**
- Conexão testada: **USB com fio**

O SignalRGB abria corretamente o endpoint HID do teclado, mas registrava:

```text
Unknown Device ID: [195]
Model not found in library!
Unknown protocol for 195
```

O plugin SinoWealth interno do SignalRGB já possui o layout RGB do **AULA F99**. Este fix adiciona `195 / 0xC3` como outra variante do F99 e reutiliza o layout existente.

## Como funciona

Este repositório **não redistribui o plugin SinoWealth completo do SignalRGB**.

O `scripts/Install.ps1`:

1. localiza o `Sinowealth_Keyboard_Controller.js` já instalado pelo SignalRGB;
2. copia esse arquivo para a pasta de plugins do usuário;
3. adiciona somente a associação do Device ID `195`;
4. não altera firmware do teclado;
5. não altera o Registro do Windows.

## Instalação

Feche completamente o SignalRGB e rode:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Install.ps1
```

Depois abra o SignalRGB novamente.

## Remoção

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Uninstall.ps1
```

## Avisos

- **Não é necessário atualizar firmware.**
- O fix foi testado em uma unidade que retorna **`0xC3 / 195`**.
- `258A:010C` sozinho não identifica o modelo, pois outros dispositivos SinoWealth podem compartilhar o mesmo VID:PID.
- Quando o SignalRGB adicionar `0xC3` oficialmente, remova o override.
