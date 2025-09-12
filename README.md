# Image Editor

[中文](README_zh_CN.md)

> Edit note image with tui-image-editor or filerobot-image-editor in [siyuan-note](https://github.com/siyuan-note/siyuan/).

> [!WARNING]
> 
> Please note before use that the plugin introduces an (some) open source image editor, and there is no style isolation, which may conflict with themes, plugins, CSS/JS. 

## Quick Start

- Download from the marketplace **or**:  
  1. Unzip `package.zip` from the Release,  
  2. Move the folder to `workspace/data/plugins/`,  
  3. Rename the folder to `syplugin-imageEditor`;  
- Enable the plugin;  
- Right-click on an image → Plugins → Edit with Image Editor;  

> ⭐ If this project is helpful to you, please consider giving it a Star!

## Frequently Asked Questions

- Q: Are image hosting services supported?  
  - Not supported;  
- Q: Is mobile supported?  
  - Not supported;  

## References & Acknowledgments

> Some dependencies are listed in `package.json`.

| Developer/Project                                                   | Description       | Usage                                   |
|----------------------------------------------------------------------|------------------|-----------------------------------------|
| [tui.image-editor](https://github.com/nhn/tui.image-editor/)         | Image editor     | Used as the main image editor, included as a dependency in this project |
| [filerobot-image-editor](https://github.com/scaleflex/filerobot-image-editor) | Image editor     | Used as the main image editor, included as a dependency in this project |
| [lucide](https://lucide.dev/)                                        | Provides a wide variety of icons [ISC License](https://lucide.dev/license) | Certain icons are used in plugins       |