import { useRef, useState } from "react";
import { MapPinned, Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
type MapItem = {
  name: string;
  location: string;
  mapImage?: string;
  mapSource?: string;
  mapAvailable?: boolean;
  mapWidth?: number;
  mapHeight?: number;
};
export default function GatheringMap({ item }: { item: MapItem }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false),
    [zoom, setZoom] = useState(1);
  const mapSrc = item.mapSource || item.mapImage;
  if (!item.mapAvailable || !mapSrc)
    return (
      <div className="gathering-map-unavailable">
        <MapPinned size={18} />
        <span>
          原站尚未提供採集地圖
          <br />
          <small>目前可用其他材料與教授 1:1 兌換。</small>
        </span>
      </div>
    );
  return (
    <>
      <figure className="gathering-map">
        {failed ? (
          <div className="gathering-map-unavailable" role="status">
            地圖暫時無法載入，請稍後重試。
          </div>
        ) : (
          <button
            className="gathering-map-trigger"
            aria-label={`放大${item.name}採集地圖`}
            onClick={() => {
              setZoom(1);
              dialog.current?.showModal();
            }}
          >
            <img
              src={mapSrc}
              alt={`${item.name}採集位置地圖`}
              width={item.mapWidth}
              height={item.mapHeight}
              loading="lazy"
              onError={() => setFailed(true)}
            />
            <span className="map-inline-zoom">
              <Maximize2 size={14} /> 本頁放大
            </span>
          </button>
        )}
        <figcaption>
          <MapPinned size={13} /> 採集地圖 <span>點擊圖片查看細節</span>
        </figcaption>
      </figure>
      <dialog
        ref={dialog}
        className="gathering-map-dialog"
        aria-label={`${item.name}地圖詳情`}
        onClick={e => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="map-dialog-header">
          <div>
            <p className="section-kicker">GATHERING MAP / IN-PAGE VIEW</p>
            <h3>{item.name}</h3>
            <p>{item.location}</p>
          </div>
          <button
            className="icon-button"
            aria-label="關閉採集地圖"
            onClick={() => dialog.current?.close()}
          >
            <X size={18} />
          </button>
        </div>
        <div
          className="map-zoom-viewport"
          tabIndex={0}
          aria-label="地圖，可捲動查看"
        >
          <img
            src={mapSrc}
            alt={`${item.name}完整採集地圖`}
            style={{ width: `${zoom * 100}%` }}
          />
        </div>
        <div className="map-zoom-controls">
          <span>縮放 {Math.round(zoom * 100)}%</span>
          <button
            aria-label="縮小地圖"
            disabled={zoom <= 1}
            onClick={() => setZoom(v => Math.max(1, v - 0.5))}
          >
            <Minus size={16} />
          </button>
          <button
            aria-label="放大地圖"
            disabled={zoom >= 3}
            onClick={() => setZoom(v => Math.min(3, v + 0.5))}
          >
            <Plus size={16} />
          </button>
          <button onClick={() => setZoom(1)}>
            <RotateCcw size={14} />
            重設
          </button>
          <small>放大後可捲動地圖 · Esc 關閉</small>
        </div>
      </dialog>
    </>
  );
}
