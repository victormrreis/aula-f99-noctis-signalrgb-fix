# AULA F99 Noctis / ABNT2 — fix SignalRGB para `0xC3`

Correção comunitária testada em um **AULA F99 Noctis ABNT2** que aparecia no SignalRGB apenas como **“Sinowealth Device”**.

## Hardware testado

- Modelo: **AULA F99 Noctis**
- Layout: **ABNT2**
- USB VID:PID: **`258A:010C`**
- Device/model ID interno SinoWealth: **`195` decimal / `0xC3`**
- Conexões testadas: **USB com fio** e **receptor 2.4 GHz** (`3554:FA09`, por tecla, veja abaixo)

O SignalRGB abria corretamente o endpoint HID do teclado, mas registrava:

```text
Unknown Device ID: [195]
Model not found in library!
Unknown protocol for 195
```

O plugin SinoWealth interno do SignalRGB já possui o layout RGB do **AULA F99**. Este fix adiciona `195 / 0xC3` como outra variante do F99 e reutiliza o layout existente.

## Receptor 2.4 GHz (dongle): RGB por tecla

Pelo receptor 2.4 GHz o teclado aparece como **`3554:FA09`** ("2.4G Wireless Receiver"). O plugin original do SignalRGB para esse ID mostra **“OEM Wireless Keyboard”** com um LED só (apenas cor sólida).

O [`plugins/OEM_Keyboard_Wireless_Controller.js`](plugins/OEM_Keyboard_Wireless_Controller.js) substitui esse plugin (override do usuário) e mostra o teclado como **AULA F99 Noctis (2.4G)**, com o layout F99 completo, tecla por tecla.

- Protocolo: relatórios de saída de 20 bytes na interface 1, usage page `0xFF02`. As cores vão em grupos `[R, G, B, quantidade, códigos das teclas…]` divididos em vários pacotes. Baseado na engenharia reversa da comunidade na [issue #5166 do OpenRGB](https://gitlab.com/CalcProgrammer1/OpenRGB/-/work_items/5166).
- Os códigos das teclas no receptor são os mesmos índices de LED do F99 com fio, então o layout é o mesmo nas duas conexões.
- O gargalo é o rádio 2.4G (medido, veja [`diagnostics/2.4g-receiver-measurements.txt`](diagnostics/2.4g-receiver-measurements.txt)): a animação só fica fluida com quadros de até ~10 pacotes e abaixo de ~230 pacotes/s. Uma cor diferente em cada tecla precisaria de ~38 pacotes.
- Por isso cada quadro vira uma **paleta adaptativa** (median cut) que cabe num orçamento de pacotes, e os quadros são espaçados pelo tamanho (≤ ~230 pacotes/s).
- O SignalRGB espera ~33 ms depois de cada Render por padrão; como um quadro de 10 pacotes já leva ~28 ms em `device.write`, o plugin chama `device.setFrameRateTarget(60)` e sobe de ~16 para ~21 quadros/s. O SignalRGB marca essa função como de desenvolvimento.
- Mesmo assim o 2.4G fica em ~21 quadros/s (cabo: ~44), então efeitos rápidos ficam menos fluidos que no cabo. Baixar para 8 pacotes não mudou nada, o que aponta para o próprio teclado/rádio.
- Opções do aparelho:
  - **2.4G Smoothness / Colors**: orçamento de pacotes por quadro. *Balanced (10 packets)* é o padrão; *Smoothest (8)* é o mais seguro; *More colors (13)* pode travar.
  - **2.4G Motion Smoothing**: Off / Light / Medium (padrão) / Strong. Mistura cada quadro com o anterior para as cores deslizarem a ~21 quadros/s em vez de pular; mais forte reage um pouco depois.
  - **2.4G Log Stats**: registra quadros/s, pacotes por quadro e tamanho da paleta no console do aparelho a cada 5 s.
- O comando de cor sólida (`0x23`) anima mal neste teclado, então quadros de uma cor só também vão por tecla.
- A posição do aparelho no canvas de **Layout** do SignalRGB é escolhida pelo SignalRGB, não pelo plugin. Se ficar num lugar estranho, ajuste uma vez; o SignalRGB guarda a posição.
- As teclas extras do ABNT2 não estão mapeadas, igual ao layout com fio.

Testado num AULA F99 Noctis ABNT2 com SignalRGB 2.5.86.

## Como funciona

Este repositório **não redistribui o plugin SinoWealth completo do SignalRGB**.

O `scripts/Install.ps1`:

1. localiza o `Sinowealth_Keyboard_Controller.js` já instalado pelo SignalRGB;
2. copia esse arquivo para a pasta de plugins do usuário;
3. adiciona somente a associação do Device ID `195`;
4. não altera firmware do teclado;
5. não altera o Registro do Windows;
6. copia `plugins/OEM_Keyboard_Wireless_Controller.js` para a mesma pasta de plugins do usuário (receptor 2.4 GHz), fazendo backup de uma cópia anterior.

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
