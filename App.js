import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('beerDatas.db');

const B = (props) => <Text style={{fontWeight: 'bold'}}>{props.children}</Text>

export default function app() {
  const [beers, setBeers] = useState([]);
  const [isAwaitAPI, setisAwaitAPI] = useState(false);

  useEffect(() => {
    createTable();
    selectBeersDataBase();
  }, []);

  const createTable = () => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS beers (id INTEGER PRIMARY KEY AUTOINCREMENT, brand TEXT, name TEXT, style TEXT);',
        [],
        () => {
          console.log('Successfully create table!');
        },
        error => {
          console.log('Error in create a table: ', error);
        }
      );
    });
  };

  const getBeerAPI = async () => {
    try {
      setisAwaitAPI(true);

      const response = await fetch(
        'https://random-data-api.com/api/beer/random_beer'
      );
      const beerData = await response.json();
      const { brand, name, style } = beerData;

      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO beers (brand, name, style) VALUES (?, ?, ?);',
          [brand, name, style],
          () => {
            console.log('Beer '+name+' save successfully');
          },
          error => {
            console.log('Err:', error);
          }
        );
      });

      setBeers(selectBeersDataBase);
    } catch (error) {
      console.log('Err when searching in API: ', error);
    } finally {
      setisAwaitAPI(false);
    }
  };

const selectBeersDataBase = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM beers;',
        [],
        (resultSet, { rows }) => {
          let beersTemp = []
          const savedBeers = rows._array;
          savedBeers.forEach(beer => {
            beersTemp.push(beer)
          })
          setBeers(beersTemp)
        },
        error => {
          console.log('Err with database:', error);
        }
      );
    });
  };

  const buttonPress = () => {
    getBeerAPI();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Beers</Text>
      <FlatList
        data={beers}
        renderItem={({ item }) => (
          <View style={styles.beerContainer}>
            <Text style={styles.item}><B>Brand: </B>{item.brand}</Text>
            <Text style={styles.item}><B>Name: </B>{item.name}</Text>
            <Text style={styles.item}><B>Style: </B>{item.style}</Text>
          </View>
        )}
        ItemSeparatorComponent={<View style={styles.separator}/>}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
      />

      <Button
        title={isAwaitAPI ? 'Carregando...' : 'Buscar Nova Bebida'}
        onPress={buttonPress}
        disabled={isAwaitAPI}
        style={{marginBottom: 32}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    flexGrow: 1,
  },
  beerContainer: {
    alignItems: 'flex-start',
    marginBottom: 6,
    marginTop: 6,
  },
  item: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: 'skyblue',
    marginVertical: 4,
  },
});