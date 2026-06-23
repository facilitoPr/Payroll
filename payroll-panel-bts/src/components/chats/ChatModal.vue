<template>
    <q-dialog v-model="modalOpen" persistent>
        <q-card style="width: 1100px; max-width: 90vw">

            <div class="bg-white row justify-between q-pa-md">
                <div class="text-primary" style="font-size: 19px; font-weight: 500">
                    <div class="row items-center">
                        <div class="col-auto q-mx-sm">
                            <q-icon size="2em" name="chat" color="primary" />
                        </div>
                        <div class="col-auto text-primary">
                            <b>{{ props.comercial?.MemberFullname }}</b>
                        </div>
                    </div>
                </div>
                <span class="material-icons text-negative" style="font-size: 23px; cursor: pointer"
                    @click="closeModal();">
                    cancel
                </span>
            </div>

            <q-card-section class="q-pt-sm">
                <!-- <TableRelationship :rows="comercials" :tableLoading="tableLoading"
                    :comercialRelationship="comercialRelationship" :comercialData="comercialData" /> -->

                <div class="col-12 row">
                    <div class="col-12 col-md-3 q-mb-md">
                        <q-select v-model="phoneSelected" label="NUMEROS DE TELEFONO" option-label="name" outlined dense
                            color="primary" :options="phones">
                            <template v-slot:no-option>
                                <q-item>
                                    <q-item-section class="text-grey">
                                        No results
                                    </q-item-section>
                                </q-item>
                            </template>
                        </q-select>
                    </div>

                    <div class="col-12 col-md-2 q-mx-sm">
                        <q-btn color="primary" label="CONFIRMAR" style="width: 100%; height: 40px" icon="check"
                            @click="addDate" :disable="datesRange == null" />
                    </div>

                    <div class="col-12">
                        <label class="row items-center justify-between q-mb-xs">
                            <b> NOTA </b>
                        </label>
                        <q-editor style="border-color: #007ec4" toolbar-bg="primary" toolbar-text-color="white"
                            v-model="form.note" :dense="$q.screen.lt.md" :toolbar="[
                            [
                                {
                                    label: $q.lang.editor.align,
                                    icon: $q.iconSet.editor.align,
                                    fixedLabel: true,
                                    list: 'only-icons',
                                    options: ['left', 'center', 'right', 'justify'],
                                },
                                {
                                    label: $q.lang.editor.align,
                                    icon: $q.iconSet.editor.align,
                                    fixedLabel: true,
                                    options: ['left', 'center', 'right', 'justify'],
                                },
                            ],
                            [
                                'bold',
                                'italic',
                                'strike',
                                'underline',
                                'subscript',
                                'superscript',
                            ],
                            ['token', 'hr', 'link', 'custom_btn'],
                            [
                                {
                                    label: $q.lang.editor.formatting,
                                    icon: $q.iconSet.editor.formatting,
                                    list: 'no-icons',
                                    options: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code'],
                                },
                                {
                                    label: $q.lang.editor.fontSize,
                                    icon: $q.iconSet.editor.fontSize,
                                    fixedLabel: true,
                                    fixedIcon: true,
                                    list: 'no-icons',
                                    options: [
                                        'size-1',
                                        'size-2',
                                        'size-3',
                                        'size-4',
                                        'size-5',
                                        'size-6',
                                        'size-7',
                                    ],
                                },
                                {
                                    label: $q.lang.editor.defaultFont,
                                    icon: $q.iconSet.editor.font,
                                    fixedIcon: true,
                                    list: 'no-icons',
                                    options: [
                                        'default_font',
                                        'arial',
                                        'arial_black',
                                        'comic_sans',
                                        'courier_new',
                                        'impact',
                                        'lucida_grande',
                                        'times_new_roman',
                                        'verdana',
                                    ],
                                },
                                'removeFormat',
                            ],
                            ['quote', 'unordered', 'ordered', 'outdent', 'indent'],

                            ['undo', 'redo'],
                        ]" :fonts="{
                arial: 'Arial',
                arial_black: 'Arial Black',
                comic_sans: 'Comic Sans MS',
                courier_new: 'Courier New',
                impact: 'Impact',
                lucida_grande: 'Lucida Grande',
                times_new_roman: 'Times New Roman',
                verdana: 'Verdana',
                    }" />
                    </div>
                </div>
                <q-btn style="float: right;" class="q-my-md" type="submit" color="primary" label="ENVIAR" icon="send"
                    @click="save" :disable="form.note == ''" />
            </q-card-section>

            <q-inner-loading :showing="isLoading" label="Enviando..." label-class="text-blue-11"
                label-style="font-size: 1.1em" />
        </q-card>
    </q-dialog>

    <NotificationsVue ref="notify" />
</template>

<script setup>
import methodsHttp from "src/api/methodsHttp";
import TableRelationship from "src/components/asignments/TableRelationship.vue"
import NotificationsVue from "src/components/utils/Notifications.vue";
import { defineProps, defineEmits, ref, watch, onMounted } from 'vue';

const props = defineProps({
    openModal: {
        type: Boolean,
        required: true
    },
    comercial: {
        type: Object,
        required: true
    }
});

const isLoading = ref(false);
const comercials = ref([]);
const comercialRelationship = ref(null)
const tableLoading = ref(false);
const orderQuantity = ref(1);
const notify = ref(null);
const comercialData = ref(null);
const form = ref({
    note: ""
})
const phones = ref([]);
const phoneSelected = ref(null);

const createOrGetComercialRelationship = async (comercial) => {
    // tableLoading.value = true;
    const data = { _id: comercial._id }
    let resp = await methodsHttp.postApi(`comercial/createOrGetComercialRelationship/${props.comercial?.HomePhone ? props.comercial?.HomePhone : "null"}/${props.comercial?.AlternatePhone ? props.comercial?.AlternatePhone : "null"}/${props.comercial?.memberIdentificationNumber}`, data);

    if (resp.ok) {
        comercialRelationship.value = resp.comercialRelationship
        if (resp.comercials) {
            comercials.value = resp.comercials
        } else {
            comercials.value = []
        }
        orderQuantity.value = Math.ceil(resp.count / 10)
    }
    // tableLoading.value = false;
};

watch(() => props.comercial, (newVal) => {
    let phonesArray = [];

    if (props.comercial.HomePhone) {
        phonesArray.push(props.comercial.HomePhone);
    }

    if (props.comercial.AlternatePhone) {
        phonesArray.push(props.comercial.AlternatePhone);
    }
    phones.value = phonesArray;
});
// 

const emit = defineEmits(['update:openModal']);
const modalOpen = ref(props.openModal);

// Sincroniza el modal abierto con el valor que viene del padre
watch(() => props.openModal, (newVal) => {
    modalOpen.value = newVal;
});

// Emite el evento para cerrar el modal y sincroniza el estado del modal en el hijo
const closeModal = () => {
    emit('update:openModal', false);
    modalOpen.value = false;
};


// Observa cambios en modalOpen para asegurarse de que el valor en el padre también se sincronice si cambia en el hijo
watch(modalOpen, (newVal) => {
    emit('update:openModal', newVal);
});

</script>
