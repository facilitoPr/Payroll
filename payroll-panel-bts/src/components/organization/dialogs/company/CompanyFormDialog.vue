<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="company-dialog">
      <q-card-section class="dialog-header row items-start justify-between">
        <div class="row items-center q-gutter-sm">
          <q-avatar color="white" text-color="primary" icon="business" />

          <div>
            <div class="text-h6 text-weight-bold">
              {{ isEditMode ? "Editar compañía" : "Agregar compañía" }}
            </div>
            <div class="text-caption text-blue-1">
              Completa la información legal, visual y pública de la empresa.
            </div>
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          color="white"
          :disable="loading"
          @click="close"
        />
      </q-card-section>

      <q-tabs
        v-model="tab"
        dense
        align="left"
        class="text-primary form-tabs"
        active-color="primary"
        indicator-color="primary"
        narrow-indicator
      >
        <q-tab name="general" icon="business" label="General" />
        <q-tab name="address" icon="location_on" label="Dirección" />
        <q-tab name="banking" icon="account_balance" label="Banco" />
        <q-tab name="publicProfile" icon="public" label="Perfil público" />
        <q-tab name="notes" icon="notes" label="Notas" />
      </q-tabs>

      <q-separator />

      <q-card-section class="dialog-body q-pa-lg">
        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="general" class="q-pa-none">
            <div class="section-title">Identificación</div>

            <div class="helper-card q-mb-md">
              <q-icon name="tips_and_updates" size="20px" color="primary" />
              <span>
                El código interno se generará automáticamente desde el nombre de
                la empresa.
              </span>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.legalName"
                  outlined
                  dense
                  color="primary"
                  label="Nombre legal *"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="business" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.tradeName"
                  outlined
                  dense
                  color="primary"
                  label="Nombre comercial"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="storefront" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.taxId"
                  outlined
                  dense
                  color="primary"
                  label="RNC / Tax ID"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="badge" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.businessGroupName"
                  outlined
                  dense
                  color="primary"
                  label="Grupo empresarial"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="corporate_fare" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.ownerName"
                  outlined
                  dense
                  color="primary"
                  label="Dueño / Representante"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="person" />
                  </template>
                </q-input>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="section-title">Contacto</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.contactName"
                  outlined
                  dense
                  color="primary"
                  label="Persona de contacto"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="contacts" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.email"
                  outlined
                  dense
                  color="primary"
                  label="Correo"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="mail" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.phone"
                  outlined
                  dense
                  color="primary"
                  label="Teléfono"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="phone" />
                  </template>
                </q-input>
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.website"
                  outlined
                  dense
                  color="primary"
                  label="Website"
                  class="rounded-input"
                >
                  <template #prepend>
                    <q-icon name="language" />
                  </template>
                </q-input>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="section-title">Logo, portada y configuración</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <ImageUploadField
                  title="Logo"
                  url-label="URL del logo"
                  file-label="Subir logo"
                  :url="form.logo"
                  :file="form.logoFile"
                  :removed="form.removeLogo"
                  :preview-url="getImagePreview(form.logoFile, form.logo)"
                  @update:url="setImageUrl('logo', $event)"
                  @update:file="setImageFile('logo', $event)"
                  @remove="markImageForRemoval('logo')"
                  @restore="restoreImage('logo')"
                  fit="contain"
                />
              </div>

              <div class="col-12 col-md-6">
                <ImageUploadField
                  title="Portada"
                  url-label="URL de portada"
                  file-label="Subir portada"
                  :url="form.coverUrl"
                  :file="form.coverFile"
                  :removed="form.removeCover"
                  :preview-url="getImagePreview(form.coverFile, form.coverUrl)"
                  @update:url="setImageUrl('cover', $event)"
                  @update:file="setImageFile('cover', $event)"
                  @remove="markImageForRemoval('cover')"
                  @restore="restoreImage('cover')"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  v-model="form.primaryColor"
                  outlined
                  dense
                  color="primary"
                  label="Color principal"
                  class="rounded-input"
                >
                  <template #append>
                    <q-icon
                      name="palette"
                      :style="{ color: form.primaryColor }"
                    />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  v-model="form.secondaryColor"
                  outlined
                  dense
                  color="primary"
                  label="Color secundario"
                  class="rounded-input"
                >
                  <template #append>
                    <q-icon
                      name="palette"
                      :style="{ color: form.secondaryColor }"
                    />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-2">
                <q-input
                  v-model="form.settings.timezone"
                  outlined
                  dense
                  color="primary"
                  label="Zona horaria"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-2">
                <q-input
                  v-model="form.settings.currency"
                  outlined
                  dense
                  color="primary"
                  label="Moneda"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-2">
                <q-input
                  v-model="form.settings.language"
                  outlined
                  dense
                  color="primary"
                  label="Idioma"
                  class="rounded-input"
                />
              </div>

              <div class="col-12">
                <div class="status-box">
                  <div class="row items-center q-gutter-md">
                    <q-toggle
                      v-model="form.isDefault"
                      color="primary"
                      label="Empresa por defecto"
                    />

                    <q-toggle
                      v-model="form.isActive"
                      color="primary"
                      label="Empresa activa"
                    />

                    <q-toggle
                      v-model="form.showInPublicLanding"
                      color="primary"
                      label="Mostrar en landing pública"
                    />
                  </div>
                </div>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="address" class="q-pa-none">
            <div class="section-title">Dirección</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-3">
                <q-input
                  v-model="form.address.country"
                  outlined
                  dense
                  color="primary"
                  label="País"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  v-model="form.address.state"
                  outlined
                  dense
                  color="primary"
                  label="Provincia/Estado"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  v-model="form.address.city"
                  outlined
                  dense
                  color="primary"
                  label="Ciudad"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  v-model="form.address.zipCode"
                  outlined
                  dense
                  color="primary"
                  label="Código postal"
                  class="rounded-input"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.address.street"
                  outlined
                  dense
                  color="primary"
                  label="Calle / Sector"
                  class="rounded-input"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.address.fullAddress"
                  outlined
                  dense
                  autogrow
                  type="textarea"
                  color="primary"
                  label="Dirección completa"
                  class="rounded-input"
                />
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="section-title">Información fiscal</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.fiscalInfo.taxRegime"
                  outlined
                  dense
                  color="primary"
                  label="Régimen fiscal"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.fiscalInfo.fiscalAddress"
                  outlined
                  dense
                  color="primary"
                  label="Dirección fiscal"
                  class="rounded-input"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.fiscalInfo.notes"
                  outlined
                  dense
                  autogrow
                  type="textarea"
                  color="primary"
                  label="Notas fiscales"
                  class="rounded-input"
                />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="banking" class="q-pa-none">
            <div class="section-title">Datos bancarios</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-input
                  v-model="form.banking.originBankName"
                  outlined
                  dense
                  color="primary"
                  label="Banco origen"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-2">
                <q-input
                  v-model="form.banking.originBankCode"
                  outlined
                  dense
                  color="primary"
                  label="Código banco"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-2">
                <q-input
                  v-model="form.banking.originBankDigit"
                  outlined
                  dense
                  color="primary"
                  label="Dígito banco"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-2">
                <q-select
                  v-model="form.banking.originAccountType"
                  :options="accountTypeOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  color="primary"
                  label="Tipo cuenta"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-2">
                <q-select
                  v-model="form.banking.currencyCode"
                  :options="currencyOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  color="primary"
                  label="Moneda banco"
                  class="rounded-input"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.banking.originAccountNumber"
                  outlined
                  dense
                  color="primary"
                  label="Número de cuenta"
                  class="rounded-input"
                />
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="section-title">Archivo bancario / nómina</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-3">
                <q-input
                  v-model="form.bankFileConfig.agreementCode"
                  outlined
                  dense
                  color="primary"
                  label="Código de convenio"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  v-model="form.bankFileConfig.serviceCode"
                  outlined
                  dense
                  color="primary"
                  label="Código de servicio"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.bankFileConfig.defaultStatementDescription"
                  outlined
                  dense
                  color="primary"
                  label="Descripción default"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  v-model.number="form.bankFileConfig.bankFileLayoutVersion"
                  outlined
                  dense
                  type="number"
                  color="primary"
                  label="Versión layout"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-input
                  v-model="form.bankFileConfig.fileEncoding"
                  outlined
                  dense
                  color="primary"
                  label="Encoding"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-select
                  v-model="form.bankFileConfig.lineEnding"
                  :options="lineEndingOptions"
                  outlined
                  dense
                  color="primary"
                  label="Salto de línea"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-3">
                <q-select
                  v-model="form.bankFileConfig.defaultPaddingChar"
                  :options="paddingOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  color="primary"
                  label="Relleno"
                  class="rounded-input"
                />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="publicProfile" class="q-pa-none">
            <div class="row items-start justify-between q-mb-md">
              <div>
                <div class="section-title q-mb-xs">
                  Perfil público / Landing
                </div>
                <div class="text-caption text-grey-7">
                  Estos campos alimentan la landing pública por empresa.
                </div>
              </div>

              <q-toggle
                v-model="form.showInPublicLanding"
                color="primary"
                label="Visible"
              />
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.publicProfile.headline"
                  outlined
                  dense
                  color="primary"
                  label="Headline"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.publicProfile.subtitle"
                  outlined
                  dense
                  color="primary"
                  label="Subtítulo"
                  class="rounded-input"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.publicProfile.aboutTitle"
                  outlined
                  dense
                  color="primary"
                  label="Título sección Nuestra Familia"
                  class="rounded-input"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.publicProfile.aboutDescription"
                  outlined
                  dense
                  autogrow
                  type="textarea"
                  color="primary"
                  label="Descripción principal"
                  class="rounded-input"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.publicProfile.aboutSecondDescription"
                  outlined
                  dense
                  autogrow
                  type="textarea"
                  color="primary"
                  label="Descripción secundaria"
                  class="rounded-input"
                />
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="section-title">Trayectoria</div>

            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model="form.publicProfile.trajectoryTitle"
                  outlined
                  dense
                  color="primary"
                  label="Título de trayectoria"
                  class="rounded-input"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.publicProfile.trajectoryDescription"
                  outlined
                  dense
                  autogrow
                  type="textarea"
                  color="primary"
                  label="Descripción de trayectoria"
                  class="rounded-input"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.publicProfile.trajectorySecondDescription"
                  outlined
                  dense
                  autogrow
                  type="textarea"
                  color="primary"
                  label="Descripción secundaria de trayectoria"
                  class="rounded-input"
                />
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="section-title">Misión, visión y valores</div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.publicProfile.mission"
                  outlined
                  dense
                  autogrow
                  type="textarea"
                  color="primary"
                  label="Misión"
                  class="rounded-input"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.publicProfile.vision"
                  outlined
                  dense
                  autogrow
                  type="textarea"
                  color="primary"
                  label="Visión"
                  class="rounded-input"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="form.publicProfile.valuesDescription"
                  outlined
                  dense
                  autogrow
                  type="textarea"
                  color="primary"
                  label="Descripción general de valores"
                  class="rounded-input"
                />
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="row items-center justify-between q-mb-sm">
              <div class="section-title q-mb-none">Valores</div>

              <q-btn
                outline
                rounded
                dense
                color="primary"
                icon="add"
                label="Agregar valor"
                class="mini-action-btn"
                @click="addValue"
              />
            </div>

            <div class="column q-gutter-sm">
              <q-card
                v-for="(item, index) in form.publicProfile.values"
                :key="`value-${index}`"
                flat
                bordered
                class="dynamic-card"
              >
                <div class="row q-col-gutter-md items-start">
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model="item.title"
                      outlined
                      dense
                      color="primary"
                      label="Título"
                      class="rounded-input"
                    />
                  </div>

                  <div class="col-12 col-md-3">
                    <q-input
                      v-model="item.icon"
                      outlined
                      dense
                      color="primary"
                      label="Icono"
                      class="rounded-input"
                    >
                      <template #append>
                        <q-icon :name="item.icon || 'check_circle'" />
                      </template>
                    </q-input>
                  </div>

                  <div class="col-12 col-md-4">
                    <q-input
                      v-model="item.description"
                      outlined
                      dense
                      autogrow
                      type="textarea"
                      color="primary"
                      label="Descripción"
                      class="rounded-input"
                    />
                  </div>

                  <div class="col-12 col-md-1 flex flex-center">
                    <q-btn
                      flat
                      round
                      dense
                      color="negative"
                      icon="delete"
                      @click="removeValue(index)"
                    />
                  </div>
                </div>
              </q-card>

              <div
                v-if="!form.publicProfile.values.length"
                class="empty-dynamic-box"
              >
                No hay valores agregados.
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="row items-center justify-between q-mb-sm">
              <div class="section-title q-mb-none">Estadísticas</div>

              <q-btn
                outline
                rounded
                dense
                color="primary"
                icon="add"
                label="Agregar estadística"
                class="mini-action-btn"
                @click="addStat"
              />
            </div>

            <div class="column q-gutter-sm">
              <q-card
                v-for="(item, index) in form.publicProfile.stats"
                :key="`stat-${index}`"
                flat
                bordered
                class="dynamic-card"
              >
                <div class="row q-col-gutter-md items-start">
                  <div class="col-12 col-md-5">
                    <q-input
                      v-model="item.value"
                      outlined
                      dense
                      color="primary"
                      label="Valor"
                      class="rounded-input"
                    />
                  </div>

                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="item.label"
                      outlined
                      dense
                      color="primary"
                      label="Label"
                      class="rounded-input"
                    />
                  </div>

                  <div class="col-12 col-md-1 flex flex-center">
                    <q-btn
                      flat
                      round
                      dense
                      color="negative"
                      icon="delete"
                      @click="removeStat(index)"
                    />
                  </div>
                </div>
              </q-card>

              <div
                v-if="!form.publicProfile.stats.length"
                class="empty-dynamic-box"
              >
                No hay estadísticas agregadas.
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="section-title">Imágenes públicas</div>

            <div class="row q-col-gutter-md">
              <div
                v-for="imageItem in publicImageItems"
                :key="imageItem.key"
                :class="imageItem.col"
              >
             <ImageUploadField
  :title="imageItem.title"
  :url-label="imageItem.urlLabel"
  :file-label="imageItem.fileLabel"
  :url="getImageUrl(imageItem.key)"
  :file="getImageFile(imageItem.key)"
  :removed="getImageRemoved(imageItem.key)"
  :preview-url="
    getImagePreview(
      getImageFile(imageItem.key),
      getImageUrl(imageItem.key)
    )
  "
  @update:url="setImageUrl(imageItem.key, $event)"
  @update:file="setImageFile(imageItem.key, $event)"
  @remove="markImageForRemoval(imageItem.key)"
  @restore="restoreImage(imageItem.key)"
/>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="notes" class="q-pa-none">
            <div class="section-title">Notas internas</div>

            <q-input
              v-model="form.notes"
              outlined
              dense
              autogrow
              type="textarea"
              color="primary"
              label="Notas generales"
              class="rounded-input"
            />
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          rounded
          color="grey-8"
          icon="close"
          label="Cancelar"
          class="dialog-btn"
          :disable="loading"
          @click="close"
        />

        <q-btn
          unelevated
          rounded
          color="primary"
          icon="save"
          label="Guardar"
          class="dialog-btn"
          :loading="loading"
          :disable="!canSave"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";

import ImageUploadField from "./ImageUploadField.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  formData: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const tab = ref("general");
const objectUrls = new Map();

const accountTypeOptions = [
  { label: "Cuenta tipo 1", value: "1" },
  { label: "Cuenta tipo 2", value: "2" },
];

const currencyOptions = [
  { label: "DOP - Peso dominicano (214)", value: "214" },
  { label: "USD - Dólar estadounidense (840)", value: "840" },
  { label: "EUR - Euro (978)", value: "978" },
];

const lineEndingOptions = ["LF", "CRLF"];

const paddingOptions = [
  { label: "Espacio", value: " " },
  { label: "Cero", value: "0" },
];

const publicImageItems = [
  {
    key: "main",
    title: "Imagen principal",
    urlLabel: "URL imagen principal",
    fileLabel: "Subir imagen principal",
    col: "col-12 col-md-6",
  },
  {
    key: "secondary",
    title: "Imagen secundaria",
    urlLabel: "URL imagen secundaria",
    fileLabel: "Subir imagen secundaria",
    col: "col-12 col-md-6",
  },
  {
    key: "third",
    title: "Tercera imagen",
    urlLabel: "URL tercera imagen",
    fileLabel: "Subir tercera imagen",
    col: "col-12 col-md-6",
  },
  {
    key: "trajectory",
    title: "Imagen trayectoria",
    urlLabel: "URL imagen trayectoria",
    fileLabel: "Subir imagen trayectoria",
    col: "col-12 col-md-6",
  },
  {
    key: "hero",
    title: "Imagen Hero",
    urlLabel: "URL imagen hero",
    fileLabel: "Subir imagen hero",
    col: "col-12",
  },
];

const imageConfig = {
  logo: {
    urlPath: ["logo"],
    fileKey: "logoFile",
    removeKey: "removeLogo",
  },
  cover: {
    urlPath: ["coverUrl"],
    fileKey: "coverFile",
    removeKey: "removeCover",
  },
  main: {
    urlPath: ["publicProfile", "images", "main"],
    fileKey: "publicMainFile",
    removeKey: "removePublicMain",
  },
  secondary: {
    urlPath: ["publicProfile", "images", "secondary"],
    fileKey: "publicSecondaryFile",
    removeKey: "removePublicSecondary",
  },
  third: {
    urlPath: ["publicProfile", "images", "third"],
    fileKey: "publicThirdFile",
    removeKey: "removePublicThird",
  },
  trajectory: {
    urlPath: ["publicProfile", "images", "trajectory"],
    fileKey: "publicTrajectoryFile",
    removeKey: "removePublicTrajectory",
  },
  hero: {
    urlPath: ["publicProfile", "images", "hero"],
    fileKey: "publicHeroFile",
    removeKey: "removePublicHero",
  },
};

const defaultForm = () => ({
  _id: null,

  legalName: "",
  tradeName: "",
  taxId: "",
  businessGroupName: "",
  ownerName: "",

  contactName: "",
  email: "",
  phone: "",
  website: "",

  logo: "",
  logoUrl: "",
  logoFile: null,
  removeLogo: false,

  coverUrl: "",
  coverFile: null,
  removeCover: false,

  primaryColor: "#024D48",
  secondaryColor: "#1964A2",

  address: {
    country: "República Dominicana",
    state: "",
    city: "",
    street: "",
    zipCode: "",
    fullAddress: "",
  },

  fiscalInfo: {
    taxRegime: "",
    fiscalAddress: "",
    notes: "",
  },

  settings: {
    timezone: "America/Santo_Domingo",
    currency: "DOP",
    language: "es",
  },

  banking: {
    originBankName: "",
    originBankCode: "",
    originBankDigit: "",
    originAccountType: "1",
    originAccountNumber: "",
    currencyCode: "214",
  },

  bankFileConfig: {
    agreementCode: "",
    serviceCode: "",
    defaultStatementDescription: "NOMINA",
    bankFileLayoutVersion: 1,
    fileEncoding: "utf8",
    lineEnding: "LF",
    defaultPaddingChar: " ",
    lastSequenceDate: "",
    lastSequenceNumber: 0,
  },

  publicProfile: {
    headline: "",
    subtitle: "",
    aboutTitle: "",
    aboutDescription: "",
    aboutSecondDescription: "",
    trajectoryTitle: "",
    trajectoryDescription: "",
    trajectorySecondDescription: "",
    mission: "",
    vision: "",
    valuesDescription: "",
    values: [],
    stats: [],
    images: {
      main: "",
      secondary: "",
      third: "",
      trajectory: "",
      hero: "",
    },
  },

  publicMainFile: null,
  publicSecondaryFile: null,
  publicThirdFile: null,
  publicTrajectoryFile: null,
  publicHeroFile: null,

  removePublicMain: false,
  removePublicSecondary: false,
  removePublicThird: false,
  removePublicTrajectory: false,
  removePublicHero: false,

  showInPublicLanding: true,

  notes: "",

  isDefault: false,
  isActive: true,
});

const form = reactive(defaultForm());

const canSave = computed(() => {
  return Boolean(form.legalName?.trim());
});

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      tab.value = "general";
      fillForm();
    }
  },
);

watch(
  () => props.formData,
  () => {
    if (props.modelValue) {
      fillForm();
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls.clear();
});

const fileFields = [
  "logoFile",
  "coverFile",
  "publicMainFile",
  "publicSecondaryFile",
  "publicThirdFile",
  "publicTrajectoryFile",
  "publicHeroFile",
];

function fillForm() {
  const fresh = defaultForm();
  const source = props.formData || {};

  Object.assign(form, {
    ...fresh,
    ...source,

    logo: source.logo || source.logoUrl || "",
    logoUrl: source.logoUrl || source.logo || "",
    logoFile: null,
    removeLogo: false,

    coverUrl: source.coverUrl || "",
    coverFile: null,
    removeCover: false,

    address: {
      ...fresh.address,
      ...(source.address || {}),
    },

    fiscalInfo: {
      ...fresh.fiscalInfo,
      ...(source.fiscalInfo || {}),
    },

    settings: {
      ...fresh.settings,
      ...(source.settings || {}),
    },

    banking: {
      ...fresh.banking,
      ...(source.banking || {}),
    },

    bankFileConfig: {
      ...fresh.bankFileConfig,
      ...(source.bankFileConfig || {}),
    },

    publicProfile: {
      ...fresh.publicProfile,
      ...(source.publicProfile || {}),
      values: Array.isArray(source.publicProfile?.values)
        ? source.publicProfile.values.map((item) => ({ ...item }))
        : [],
      stats: Array.isArray(source.publicProfile?.stats)
        ? source.publicProfile.stats.map((item) => ({ ...item }))
        : [],
      images: {
        ...fresh.publicProfile.images,
        ...(source.publicProfile?.images || {}),
      },
    },

    publicMainFile: null,
    publicSecondaryFile: null,
    publicThirdFile: null,
    publicTrajectoryFile: null,
    publicHeroFile: null,

    removePublicMain: false,
    removePublicSecondary: false,
    removePublicThird: false,
    removePublicTrajectory: false,
    removePublicHero: false,

    showInPublicLanding: source.showInPublicLanding !== false,
  });
}

function getByPath(target, path) {
  return path.reduce((acc, key) => acc?.[key], target);
}

function setByPath(target, path, value) {
  const keys = [...path];
  const lastKey = keys.pop();

  const parent = keys.reduce((acc, key) => {
    if (!acc[key]) acc[key] = {};
    return acc[key];
  }, target);

  parent[lastKey] = value;
}

function getImageUrl(key) {
  const config = imageConfig[key];
  if (!config) return "";
  return getByPath(form, config.urlPath) || "";
}

function getImageFile(key) {
  const config = imageConfig[key];
  if (!config) return null;
  return form[config.fileKey] || null;
}

function getImageRemoved(key) {
  const config = imageConfig[key];
  if (!config) return false;
  return Boolean(form[config.removeKey]);
}

function setImageUrl(key, value) {
  const config = imageConfig[key];
  if (!config) return;

  setByPath(form, config.urlPath, value || "");
  form[config.removeKey] = false;

  if (key === "logo") {
    form.logoUrl = value || "";
  }
}

function setImageFile(key, value) {
  const config = imageConfig[key];
  if (!config) return;

  form[config.fileKey] = value || null;

  if (value) {
    form[config.removeKey] = false;
  }
}

function markImageForRemoval(key) {
  const config = imageConfig[key];
  if (!config) return;

  setByPath(form, config.urlPath, "");
  form[config.fileKey] = null;
  form[config.removeKey] = true;

  if (key === "logo") {
    form.logoUrl = "";
  }
}

function restoreImage(key) {
  const config = imageConfig[key];
  if (!config) return;

  form[config.removeKey] = false;
}

function getImagePreview(file, fallbackUrl = "") {
  if (typeof File !== "undefined" && file instanceof File) {
    if (objectUrls.has(file)) {
      return objectUrls.get(file);
    }

    const url = URL.createObjectURL(file);
    objectUrls.set(file, url);
    return url;
  }

  return fallbackUrl || "";
}

function addValue() {
  form.publicProfile.values.push({
    title: "",
    icon: "check_circle",
    description: "",
  });
}

function removeValue(index) {
  form.publicProfile.values.splice(index, 1);
}

function addStat() {
  form.publicProfile.stats.push({
    label: "",
    value: "",
  });
}

function removeStat(index) {
  form.publicProfile.stats.splice(index, 1);
}

function close() {
  emit("update:modelValue", false);
}

function submit() {
  const raw = JSON.parse(JSON.stringify(form));

  delete raw.code;

  for (const key of fileFields) {
    delete raw[key];
  }

  emit("save", {
    ...raw,
    logoFile: form.logoFile,
    coverFile: form.coverFile,
    publicMainFile: form.publicMainFile,
    publicSecondaryFile: form.publicSecondaryFile,
    publicThirdFile: form.publicThirdFile,
    publicTrajectoryFile: form.publicTrajectoryFile,
    publicHeroFile: form.publicHeroFile,
  });
}
</script>

<style scoped>
.company-dialog {
  width: 1160px;
  max-width: 96vw;
  max-height: 94vh;
  border-radius: 22px;
  overflow: hidden;
}

.dialog-header {
  background: var(--q-primary);
  color: white;
  padding: 18px 20px;
}

.form-tabs {
  padding: 4px 12px 0;
}

.dialog-body {
  max-height: calc(94vh - 210px);
  overflow-y: auto;
}

.rounded-input :deep(.q-field__control) {
  border-radius: 14px;
}

.section-title {
  margin-bottom: 12px;
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.helper-card {
  border: 1px solid rgba(2, 77, 72, 0.12);
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(2, 77, 72, 0.04);
  color: #475467;
  font-size: 0.86rem;
  font-weight: 600;
}

.status-box {
  border: 1px solid rgba(0, 0, 0, 0.11);
  border-radius: 16px;
  padding: 14px;
  background: #ffffff;
}

.dialog-btn {
  text-transform: none;
  font-weight: 600;
  min-width: 120px;
}

.dynamic-card {
  padding: 12px;
  border-radius: 18px;
  background: #ffffff;
}

.empty-dynamic-box {
  padding: 18px;
  border-radius: 18px;
  color: #667085;
  background: #f8fafc;
  border: 1px dashed rgba(15, 23, 42, 0.16);
  font-size: 0.86rem;
  font-weight: 600;
}

.mini-action-btn {
  text-transform: none;
  font-weight: 700;
}

.image-upload-card {
  padding: 14px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.1);
}

.image-upload-top {
  min-height: 28px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.image-upload-title {
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.image-remove-btn,
.image-restore-btn {
  border: 0;
  border-radius: 999px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 800;
}

.image-remove-btn {
  color: #c10015;
  background: rgba(193, 0, 21, 0.08);
}

.image-restore-btn {
  color: var(--q-primary);
  background: rgba(2, 77, 72, 0.08);
}

.image-upload-preview {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  margin-bottom: 12px;
  background: #f8fafc;
}

.image-upload-empty,
.image-upload-removed {
  height: 180px;
  border-radius: 16px;
  margin-bottom: 12px;
  display: grid;
  place-items: center;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px dashed rgba(15, 23, 42, 0.16);
  font-size: 0.86rem;
  font-weight: 700;
  text-align: center;
}

.image-upload-removed {
  color: #c10015;
  background: rgba(193, 0, 21, 0.04);
  border-color: rgba(193, 0, 21, 0.18);
}

.image-upload-empty i,
.image-upload-removed i {
  display: block;
  font-size: 34px;
  margin-bottom: 4px;
}

.image-upload-empty span,
.image-upload-removed span {
  display: block;
}

.image-upload-fields {
  display: grid;
  gap: 10px;
}

@media (max-width: 768px) {
  .company-dialog {
    width: 96vw;
    max-height: 94vh;
  }

  .dialog-body {
    max-height: calc(94vh - 210px);
  }

  .image-upload-preview,
  .image-upload-empty,
  .image-upload-removed {
    height: 150px;
  }

  .dialog-btn {
    width: 100%;
  }
}
</style>
