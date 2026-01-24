# Vega/Vega-Lite 测试

## Vega-Lite 柱状图

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "values": [
      {"category": "A", "value": 28},
      {"category": "B", "value": 55},
      {"category": "C", "value": 43},
      {"category": "D", "value": 91},
      {"category": "E", "value": 81}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "category", "type": "nominal"},
    "y": {"field": "value", "type": "quantitative"}
  }
}
```

## Vega-Lite 折线图

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "values": [
      {"year": 2010, "sales": 100},
      {"year": 2011, "sales": 120},
      {"year": 2012, "sales": 150},
      {"year": 2013, "sales": 180},
      {"year": 2014, "sales": 220}
    ]
  },
  "mark": "line",
  "encoding": {
    "x": {"field": "year", "type": "ordinal"},
    "y": {"field": "sales", "type": "quantitative"}
  }
}
```

## Vega-Lite 散点图

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "values": [
      {"x": 1, "y": 28},
      {"x": 2, "y": 55},
      {"x": 3, "y": 43},
      {"x": 4, "y": 91},
      {"x": 5, "y": 81}
    ]
  },
  "mark": "point",
  "encoding": {
    "x": {"field": "x", "type": "quantitative"},
    "y": {"field": "y", "type": "quantitative"}
  }
}
```
