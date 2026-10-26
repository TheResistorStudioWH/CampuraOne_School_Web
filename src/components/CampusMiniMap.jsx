import { useId } from "react";
import "../styles/campus-map.css";

function isPoint(point) {
  return Array.isArray(point) && point.length === 2 && point.every(Number.isFinite);
}

function geometryPoints(entity) {
  if (entity?.geometry) {
    const { type, coordinates } = entity.geometry;
    return type === "point" ? [coordinates] : coordinates;
  }
  return entity?.position ? [entity.position] : [];
}

function routePoints(edge, nodeById) {
  if (edge.points?.filter(isPoint).length > 1) return edge.points.filter(isPoint);
  return [nodeById.get(edge.from)?.position, nodeById.get(edge.to)?.position].filter(isPoint);
}

export default function CampusMiniMap({
  features = [],
  nodes = [],
  edges = [],
  highlight,
  comparison = [],
  wide = false,
}) {
  const gridId = useId().replaceAll(":", "");
  const canvasWidth = wide ? 500 : 300;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const routes = edges.map((edge) => routePoints(edge, nodeById));
  const points = [
    ...features.flatMap(geometryPoints),
    ...comparison.flatMap(geometryPoints),
    ...nodes.map((node) => node.position),
    ...routes.flat(),
  ].filter(isPoint);
  const bounds = points.reduce(
    (result, [x, y]) => ({
      minX: Math.min(result.minX, x),
      maxX: Math.max(result.maxX, x),
      minY: Math.min(result.minY, y),
      maxY: Math.max(result.maxY, y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
  const spanX = Math.max(bounds.maxX - bounds.minX || 0, 1);
  const spanY = Math.max(bounds.maxY - bounds.minY || 0, 1);
  const scale = Math.min((canvasWidth - 48) / spanX, 252 / spanY);
  const left = (canvasWidth - spanX * scale) / 2;
  const top = (300 - spanY * scale) / 2;
  const project = ([x, y]) => [
    left + (x - bounds.minX) * scale,
    top + (bounds.maxY - y) * scale,
  ];

  return (
    <svg
      viewBox={`0 0 ${canvasWidth} 300`}
      className="camap-preview"
      role="img"
      aria-label="校园地图平面预览"
    >
      <defs>
        <pattern id={gridId} width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M20 0H0V20"
            fill="none"
            className="camap-grid-line"
            strokeWidth=".7"
          />
        </pattern>
      </defs>
      <rect width={canvasWidth} height="300" fill={`url(#${gridId})`} />
      {routes.map((route, index) =>
        route.length > 1 ? (
          <polyline
            key={edges[index].id}
            className="camap-route"
            points={route.map((point) => project(point).join(",")).join(" ")}
          />
        ) : null,
      )}
      {features.map((feature) => {
        const shape = geometryPoints(feature).filter(isPoint);
        const featureClass =
          feature.id === highlight
            ? "camap-feature-highlight"
            : feature.kind === "building"
              ? "camap-feature-building"
              : feature.kind === "merchant"
                ? "camap-feature-merchant"
                : "camap-feature-other";
        if (!shape.length) return null;
        if (feature.geometry?.type === "polygon")
          return (
            <polygon
              key={feature.id}
              className={featureClass}
              points={shape.map((point) => project(point).join(",")).join(" ")}
              strokeWidth="1.5"
            />
          );
        if (feature.geometry?.type === "line")
          return (
            <polyline
              key={feature.id}
              className={`camap-feature-line ${featureClass}`}
              points={shape.map((point) => project(point).join(",")).join(" ")}
            />
          );
        const [x, y] = project(shape[0]);
        return (
          <g key={feature.id} className={featureClass}>
            <circle cx={x} cy={y} r="4" />
            <text x={x + 7} y={y + 3} fontSize="8" className="camap-map-label">
              {feature.name}
            </text>
          </g>
        );
      })}
      {nodes.map((node) => {
        if (!isPoint(node.position)) return null;
        const [x, y] = project(node.position);
        return <circle key={node.id} className="camap-route-node" cx={x} cy={y} r="1.7" />;
      })}
      {!points.length && (
        <text
          x={canvasWidth / 2}
          y="150"
          textAnchor="middle"
          fontSize="12"
          className="camap-map-empty"
        >
          尚无地标
        </text>
      )}
    </svg>
  );
}
