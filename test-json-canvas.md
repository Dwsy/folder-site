# JSON Canvas 测试

## 简单流程

```json-canvas
{
  "nodes": [
    {
      "id": "1",
      "type": "text",
      "text": "开始",
      "x": 50,
      "y": 50,
      "width": 120,
      "height": 80,
      "color": "#e3f2fd"
    },
    {
      "id": "2",
      "type": "text",
      "text": "处理",
      "x": 250,
      "y": 50,
      "width": 120,
      "height": 80,
      "color": "#fff3e0"
    },
    {
      "id": "3",
      "type": "text",
      "text": "结束",
      "x": 450,
      "y": 50,
      "width": 120,
      "height": 80,
      "color": "#f3e5f5"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "fromNode": "1",
      "toNode": "2"
    },
    {
      "id": "e2",
      "fromNode": "2",
      "toNode": "3"
    }
  ]
}
```

## 复杂结构

```json-canvas
{
  "nodes": [
    {
      "id": "input",
      "type": "text",
      "text": "输入",
      "x": 50,
      "y": 100,
      "width": 100,
      "height": 60,
      "color": "#c8e6c9"
    },
    {
      "id": "process1",
      "type": "text",
      "text": "处理1",
      "x": 200,
      "y": 50,
      "width": 100,
      "height": 60,
      "color": "#ffccbc"
    },
    {
      "id": "process2",
      "type": "text",
      "text": "处理2",
      "x": 200,
      "y": 150,
      "width": 100,
      "height": 60,
      "color": "#ffccbc"
    },
    {
      "id": "output",
      "type": "text",
      "text": "输出",
      "x": 350,
      "y": 100,
      "width": 100,
      "height": 60,
      "color": "#b3e5fc"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "fromNode": "input",
      "toNode": "process1"
    },
    {
      "id": "e2",
      "fromNode": "input",
      "toNode": "process2"
    },
    {
      "id": "e3",
      "fromNode": "process1",
      "toNode": "output"
    },
    {
      "id": "e4",
      "fromNode": "process2",
      "toNode": "output"
    }
  ]
}
```
