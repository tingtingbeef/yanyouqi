# 花卉视觉资源记录

本目录包含六种花卉的写实植物艺术图，由内置 imagegen 工具为「研有期」生成，非摄影师实拍照片。没有下载第三方图库素材，也没有截取参考网页的品牌、图片或页面内容。生成素材的使用遵循相应服务条款；本文件不作独占版权承诺。

每种主题提供 `{key}-hero.webp`（900×900）与 `{key}-thumb.webp`（360×360），保留原始透明通道。WebP 压缩质量分别为86/80；不依赖第三方运行时图片链接。原始PNG保存在本机生成资源目录中，交付包只包含优化版本。

## 生成提示词

每张使用同一提示词结构，将下列 Subject 分别代入：

```text
Use case: photorealistic-natural. Asset type: original botanical editorial website hero photograph cutout, one cohesive set of six assets.
Subject: [见下列六种 Subject]
Style: high-end fine-art macro botanical photography, real petal volume, subtle imperfect organic textures, soft natural window backlighting, understated luxury stationery editorial, airy soft focus only at distant edges but main petals detailed.
Composition: square 1024x1024 image; entire flower centered slightly right, bloom occupies 65-75 percent of frame; stem extends toward bottom edge; generous negative space around outer silhouette so nothing clips.
Color palette low saturation, quiet ivory highlights, organic muted greens.
Background: genuinely transparent alpha, isolated plant only; no backdrop, no cast shadow, no ground.
No lettering, no logo, no watermark, no frame, no grids, no vase, no people, no paper illustration, no watercolor, no line art or SVG look, no cartoon, no plastic CGI, no neon colors.
```

- **iris**: A single exquisite pale lavender bearded iris flower, open ruffled translucent falls and upright petals with delicate lilac veins, a small ivory and muted golden beard. Short naturally curved sage stem, one slim leaf. Airy asymmetric bloom tilted slightly left.
- **sunflower**: A single refined sunflower with pale buttercream ochre petals, a soft warm brown seed disk, two small olive green leaves and a short gently curving stem. Botanical accuracy, softly angled three-quarter flower, never bright yellow.
- **lily**: One elegant ivory white lily bloom facing gently left, six sculptural curving petals, delicate pollen-bearing stamens, soft sage stem with one narrow leaf and a small unopened bud. Luminous petal surface and subtle ivory veins.
- **lavender**: A sparse graceful arrangement of five naturally curved lavender sprigs with small dusty lilac florets, fine gray-green stems and narrow leaves, the tallest sprig slightly off center, airy editorial botanical composition. No dense field or tied bouquet.
- **wintersweet**: One sparse elegant wintersweet (Chimonanthus praecox) tea-brown curved twig with four small translucent pale wax-yellow flowers and two tiny buds, reddish brown flower centers, almost no leaves. Quiet winter daylight, natural asymmetric branch.
- **rose**: One delicate pale dusty blush garden rose in a three-quarter view, richly layered real thin petals with soft folds and creamy pale edges, sage stem and two muted green leaves, a small closed bud beside it. Refined botanical photographic realism.

## 替换资源

替换同名图片或修改 `themes.js` 中对应项的 `asset.hero`、`asset.thumb`、`asset.alt` 即可。建议保留正方形透明底、自然光、低饱和配色，避免文字、水印及硬边背景。替换为外部资源时，请同步记录来源和使用许可。加载失败时显示明确文字，不回退为线稿花。
