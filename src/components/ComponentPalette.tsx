import { Card, Divider, Typography } from 'antd';
import { componentList } from '../state/componentRegistry';
import type { ComponentType } from '../state/builderTypes';

const { Title, Paragraph } = Typography;

interface ComponentPaletteProps {
  onStartDrag: (type: ComponentType) => void;
}

const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onStartDrag }) => {
  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ marginBottom: 8 }}>
        Components
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Drag components into the canvas to build your layout.
      </Paragraph>
      <Divider style={{ margin: '12px 0' }} />
      <div style={{ display: 'grid', gap: 12 }}>
        {componentList.map((config) => (
          <Card
            key={config.type}
            size="small"
            hoverable
            style={{ cursor: 'grab' }}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'copy';
              event.dataTransfer.setData(
                'application/x-builder',
                JSON.stringify({ mode: 'new', type: config.type })
              );
              onStartDrag(config.type);
            }}
          >
            <Card.Meta
              title={config.label}
              description={config.description ?? `${config.type} component`}
            />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ComponentPalette;
