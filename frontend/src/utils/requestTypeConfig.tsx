import { HttpIcon, GraphQLIcon, WebSocketIcon } from '../components/icons/RequestTypeIcons';
import type { RequestType } from '../types/request.types';

// Re-export for convenience
export type { RequestType };

interface RequestTypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const REQUEST_TYPE_CONFIG: Record<RequestType, RequestTypeConfig> = {
  REST: {
    label: 'HTTP',
    icon: HttpIcon,
    color: 'primary',
  },
  GRAPHQL: {
    label: 'GraphQL',
    icon: GraphQLIcon,
    color: 'pink',
  },
  WEBSOCKET: {
    label: 'WebSocket',
    icon: WebSocketIcon,
    color: 'orange',
  },
} as const;

export const getRequestTypeLabel = (type: RequestType): string => {
  return REQUEST_TYPE_CONFIG[type].label;
};

export const getRequestTypeIcon = (type: RequestType) => {
  const IconComponent = REQUEST_TYPE_CONFIG[type].icon;
  return IconComponent;
};

export const getRequestTypeColor = (type: RequestType): string => {
  return REQUEST_TYPE_CONFIG[type].color;
};
