import mitt from 'mitt';

type Events = {
  'ui:open-bag': undefined;
  'ui:click': undefined;
  'hud:show': undefined;
  'hud:hide': undefined;
};

export const bus = mitt<Events>();
