import {Model, model, property} from '@loopback/repository';

@model()
export class ClaveNuevaa extends Model {
  @property({
    type: 'string',
    required: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  claveNueva: string;


  constructor(data?: Partial<ClaveNuevaa>) {
    super(data);
  }
}

export interface ClaveNuevaaRelations {
  // describe navigational properties here
}

export type ClaveNuevaaWithRelations = ClaveNuevaa & ClaveNuevaaRelations;
