import { Formik } from 'formik';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  phone: Yup.string().required('Telefone obrigatório'),
});

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
});

export default function FormExampleScreen() {
  return (
    <Formik
      initialValues={{ phone: '' }}
      validationSchema={validationSchema}
      onSubmit={(values) => alert(JSON.stringify(values))}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
        <View className="flex-1 items-center justify-center bg-white dark:bg-black p-4">
          <Text style={styles.title} className="text-black dark:text-white">Formulário de Telefone</Text>
          <TextInputMask
            type={'cel-phone'}
            options={{ maskType: 'BRL', withDDD: true, dddMask: '(99) ' }}
            value={values.phone}
            onChangeText={text => setFieldValue('phone', text)}
            onBlur={handleBlur('phone')}
            className="border p-2 w-full mb-2 text-black bg-white"
            placeholder="(99) 99999-9999"
            keyboardType="phone-pad"
          />
          {errors.phone && touched.phone && (
            <Text className="text-red-500 mb-2">{errors.phone}</Text>
          )}
          <Button title="Enviar" onPress={handleSubmit as any} />
        </View>
      )}
    </Formik>
  );
} 