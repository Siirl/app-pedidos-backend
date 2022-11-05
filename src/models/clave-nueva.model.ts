import {Model, model, property} from '@loopback/repository';

@model()
export class ClaveNueva extends Model {
  @property({
    type: 'string',
    required: true,
  })
  clave: string;


  constructor(data?: Partial<ClaveNueva>) {
    super(data);
  }
}

export interface ClaveNuevaRelations {
  // describe navigational properties here
}

export type ClaveNuevaWithRelations = ClaveNueva & ClaveNuevaRelations;
