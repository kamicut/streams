type 'a susp = unit -> 'a;
fun force t= t ();
fun delay (t : 'a susp) =
  let
      exception Impossible
      val memo : 'a susp ref = ref (fn () => raise Impossible)
      fun t' () =
          let val r = t () in memo := (fn () => r); r end
  in
      memo := t';
      fn () => (!memo)()
  end

datatype 'a Stream = Nil | Cons of 'a * 'a Stream susp
exception StreamException of string

fun from(n: int) = 
  let 
    fun from_help n = Cons(n, delay(fn() => from_help(n+1)))
  in 
    delay(fn() => from_help(n)) 
  end

fun take(n, stream: 'a Stream susp) =
  delay(fn () => 
    case n of
      0 => Nil
    | _ => case force(stream) of 
            Nil => Nil
          | Cons(x, stream') => Cons(x, take(n-1, stream'))
  )

fun drop(n, stream: 'a Stream susp): 'a Stream susp =
  let
    fun drop' (n', s') =
      case n' of
        0 => s'
      | nn => case force(s') of
              Nil => delay(fn() => Nil)
            | Cons(x, s'') => drop(n-1, s'')
  in
     drop'(n,stream)
  end

fun lhd(stream: 'a Stream susp) =
  case force(stream) of
    Nil => raise StreamException "lhd nil"
  | Cons(x, _) => x

fun ltl(stream: 'a Stream susp) =
  case force(stream) of
    Nil => raise StreamException "ltl nil"
  | Cons(x, stream') => stream'

fun toList(stream: 'a Stream susp) =
    case force(stream) of 
      Nil => []
    | Cons(x, stream') => x::toList(stream')

fun reverse s = 
  let fun reverse' (s', r) =
    case force(s') of
      Nil => r
    | Cons(x, s) => reverse' (s, Cons(x, delay(fn() => r)))
  in 
    delay(fn () => reverse'(s, Nil))
  end

fun map(f, stream: 'a Stream susp) = 
  delay(fn () => 
    case force(stream) of 
      Nil => Nil
    | Cons(x, stream') => Cons(f(x), map(f, stream'))
  )

fun filter(f, stream: 'a Stream susp) =
    case force(stream) of
      Nil => delay(fn() => Nil)
    | Cons(x, stream') => if f(x) 
                          then delay(fn() => Cons(x, filter(f, stream')))
                          else filter(f, stream')

fun apply(n: int, stream: 'a Stream susp) =
  if (n <= 0) then lhd (stream)
  else apply(n - 1, (drop (1, stream)))

fun sieve(seq) =
  let
    val head = lhd(seq)
    val tail = ltl(seq)
    fun filt(e) = (e mod head) <> 0
  in
    Cons(head, delay(fn() => sieve(filter(filt, tail))))
  end

fun fromList(lst: 'a list): 'a Stream = 
  case lst of 
    [] => Nil
  | h::t => Cons(h, delay(fn() => fromList(t)))

fun concatenate(s1: 'a Stream susp, s2: 'a Stream susp) =
    case force(s1) of
      Nil => force(s2)
    | Cons(h, t) => Cons(h, delay(fn() => concatenate(t, s2)))