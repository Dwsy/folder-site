# SVG 测试

## 简单 SVG

```svg
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="red" />
</svg>
```

## 复杂 SVG

```svg
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="180" height="180" fill="lightblue" stroke="navy" stroke-width="2"/>
  <circle cx="100" cy="100" r="50" fill="yellow" stroke="orange" stroke-width="3"/>
  <text x="100" y="105" text-anchor="middle" font-size="20" fill="black">Hello SVG</text>
</svg>
```

## SVG 路径

```svg
<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <path d="M 10 80 Q 95 10 180 80 T 350 80" stroke="blue" fill="transparent" stroke-width="2"/>
  <path d="M 10 120 L 100 120 L 100 180 L 10 180 Z" fill="green"/>
</svg>
```
