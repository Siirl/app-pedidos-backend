import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import {Llaves} from '../config/llaves';
import {ClaveNuevaa, Credenciales, Persona, Recuperacionn} from '../models';
import {PersonaRepository} from '../repositories';
import {AutenticacionService} from '../services';
const fetch = require('node-fetch');

export class PersonaController {
  constructor(
    @repository(PersonaRepository)
    public personaRepository: PersonaRepository,
    @service(AutenticacionService)
    public servicioAutenticacion: AutenticacionService
  ) { }

  @post("/identificarPersona", {
    responses: {
      '200': {
        description: "Identificacion de usuaios"
      }
    }
  })
  async identificarPersona(
    @requestBody() credenciales: Credenciales
  ) {
    let p = await this.servicioAutenticacion.IdentificarPersona(credenciales.usuario, credenciales.clave);
    if (p) {
      let token = this.servicioAutenticacion.GenerarTokenJWT(p);
      return {
        datos: {
          nombre: p.nombres,
          correo: p.correo,
          id: p.id
        },
        tk: token
      }
    } else {
      throw new HttpErrors[401]("Datos invalidos");
    }
  }

  @post("/recuperarClave", {
    responses: {
      '200': {
        description: "Recuperacion de contraseña"
      }
    }
  })
  async recoveryPassword(
    @requestBody() recuperacionn: Recuperacionn,
    @param.filter(Persona, {exclude: 'where'}) filter?: FilterExcludingWhere<Persona>,
    @param.where(Persona) where?: Where<Persona>
  ) {
    let p = await this.personaRepository.findById(recuperacionn.id, filter);
    if (p) {
      let clave = this.servicioAutenticacion.GenerarClave();
      let claveCifrada = this.servicioAutenticacion.CifrarClave(clave);
      p.clave = claveCifrada;
      this.updateById(p.id + "", p)
      let destino = p.correo;
      let asunto = 'Reestablecimiento de contraseña';
      let contenido = `Hola ${p.nombres}, se ha realizado con exito el restablecimiento de su contraseña, para poder ingresar a la web utilice la siguiente contraseña: ${clave}`;
      fetch(`${Llaves.urlServicioNotificaciones}/envio-correo?correo_destino=${destino}&asunto=${asunto}&contenido=${contenido}`)
        .then((data: any) => {
          console.log(data);
        })
      let mensaje = 'Su contraseña ha sido restablecida, por favor revisar su correo electronico';
      let telefono = p.celular;
      fetch(`${Llaves.urlServicioNotificaciones}/sms?mensaje=${mensaje}&telefono=${telefono}`)
        .then((data: any) => {
          console.log(data);
        })
      return {
        datos: {
          correo: "Su contraseña se reestablecio, por favor revise su correo: " + p.correo
        }
      }
    } else {
      throw new HttpErrors[401]("id no encontrado");
    }
  }

  @post("/cambiarClave", {
    responses: {
      '200': {
        description: "Cambio de contraseña"
      }
    }
  })
  async cambiarClave(
    @requestBody() claveNuevaa: ClaveNuevaa,
    @param.filter(Persona, {exclude: 'where'}) filter?: FilterExcludingWhere<Persona>,
    @param.where(Persona) where?: Where<Persona>
  ) {
    let p = await this.personaRepository.findById(claveNuevaa.id, filter);
    if (p) {
      let claveCifrada = this.servicioAutenticacion.CifrarClave(claveNuevaa.claveNueva);
      p.clave = claveCifrada;
      this.updateById(p.id + "", p)
      let destino = p.correo;
      let asunto = 'Contraseña modificada';
      let contenido = `Hola ${p.nombres}, se ha realizado con exito el cambio de su contraseña, para poder ingresar a la web utilice la siguiente contraseña: ${claveNuevaa.claveNueva}`;
      fetch(`${Llaves.urlServicioNotificaciones}/envio-correo?correo_destino=${destino}&asunto=${asunto}&contenido=${contenido}`)
        .then((data: any) => {
          console.log(data);
        })
      let mensaje = 'Su contraseña ha sido modificada con exito';
      let telefono = p.celular;
      fetch(`${Llaves.urlServicioNotificaciones}/sms?mensaje=${mensaje}&telefono=${telefono}`)
        .then((data: any) => {
          console.log(data);
        })
      return {
        clave: "Su clave ha sido modificada exitosamente"
      }
    } else {
      throw new HttpErrors[401]("Dato invalido por favor verifique los datos ingresados");
    }
  }





  @post('/personas')
  @response(200, {
    description: 'Persona model instance',
    content: {'application/json': {schema: getModelSchemaRef(Persona)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {
            title: 'NewPersona',
            exclude: ['id'],
          }),
        },
      },
    })
    persona: Omit<Persona, 'id'>,
  ): Promise<Persona> {

    let clave = this.servicioAutenticacion.GenerarClave();
    let claveCifrada = this.servicioAutenticacion.CifrarClave(clave);
    persona.clave = claveCifrada;
    persona.rol = "cliente";
    let p = await this.personaRepository.create(persona);

    //Notificar al usuario
    let destino = persona.correo;
    let asunto = 'Registro en la plataforma';
    let contenido = `Hola ${persona.nombres}, su nombre de usuario es ${persona.correo} y su contraseña es: ${clave}`;
    fetch(`${Llaves.urlServicioNotificaciones}/envio-correo?correo_destino=${destino}&asunto=${asunto}&contenido=${contenido}`)
      .then((data: any) => {
        console.log(data);
      })
    return p;

  }

  @get('/personas/count')
  @response(200, {
    description: 'Persona model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Persona) where?: Where<Persona>,
  ): Promise<Count> {
    return this.personaRepository.count(where);
  }

  @get('/personas')
  @response(200, {
    description: 'Array of Persona model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Persona, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Persona) filter?: Filter<Persona>,
  ): Promise<Persona[]> {
    return this.personaRepository.find(filter);
  }

  @patch('/personas')
  @response(200, {
    description: 'Persona PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {partial: true}),
        },
      },
    })
    persona: Persona,
    @param.where(Persona) where?: Where<Persona>,
  ): Promise<Count> {
    return this.personaRepository.updateAll(persona, where);
  }

  @get('/personas/{id}')
  @response(200, {
    description: 'Persona model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Persona, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Persona, {exclude: 'where'}) filter?: FilterExcludingWhere<Persona>
  ): Promise<Persona> {
    return this.personaRepository.findById(id, filter);
  }

  @patch('/personas/{id}')
  @response(204, {
    description: 'Persona PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {partial: true}),
        },
      },
    })
    persona: Persona,
  ): Promise<void> {
    await this.personaRepository.updateById(id, persona);
  }

  @put('/personas/{id}')
  @response(204, {
    description: 'Persona PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() persona: Persona,
  ): Promise<void> {
    await this.personaRepository.replaceById(id, persona);
  }

  @del('/personas/{id}')
  @response(204, {
    description: 'Persona DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.personaRepository.deleteById(id);
  }
}
