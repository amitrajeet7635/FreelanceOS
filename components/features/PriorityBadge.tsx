import { motion } from 'framer-motion';
import { Priority, PRIORITY_CONFIG } from '@/lib/types';

export function PriorityBadge({ 
  priority, 
  size = 'md', 
  onClick 
}: { 
  priority?: Priority; 
  size?: 'sm' | 'md'; 
  onClick?: () => void; 
}) {
  if (!priority) return null;
  const config = PRIORITY_CONFIG[priority];

  return (
    <motion.button
      type="button"
      whileTap={onClick ? { scale: 0.9 } : undefined}
      onClick={onClick}
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.color}33`,
        cursor: onClick ? 'pointer' : 'default',
        padding: size === 'sm' ? '2px 6px' : '4px 8px',
        fontSize: size === 'sm' ? '10px' : '12px',
        fontWeight: 600,
        borderRadius: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={config.description}
    >
      {priority}
    </motion.button>
  );
}
