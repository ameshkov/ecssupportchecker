# ECS support checker

This Node.js script queries domain names against a hardcoded list of subnets
using the `dig` command. It checks the consistency of IP addresses across
different subnets for the domains that support ECS.

* Inspired by the [NextDNS article on ECS][nextdnsecs].
* Made for my talk on [DNS OARC 47][oarc47].

[nextdnsecs]: https://medium.com/nextdns/how-we-made-dns-both-fast-and-private-with-ecs-4970d70401e5
[oarc47]: https://indico.dns-oarc.net/event/47/

## How to use

* `input.txt` - a list with ~1000 popular domain names
* `node index.js input.txt output.txt` - runs the script that tests every
    domain in the list for the ECS support and also checks if the response does
    actually depend on the subnet or if it's the same regardless of the ECS.

## Result

Here's the what I've got on *Aug 29, 2023*:

```shell
Overall domains analyzed: 998
Domains that support ECS: 497
Domains that support ECS, but results are the same across subnets: 158
```
