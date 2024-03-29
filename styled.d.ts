// import original module declarations
import 'styled-components';

// and extend them!
declare module 'styled-components' {
  export interface DefaultTheme {
    backgroundColor: string
    color: string
    vowel?: string
    consonant?: string
  }
}
